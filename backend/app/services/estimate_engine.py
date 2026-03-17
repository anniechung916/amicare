from decimal import Decimal

from app.models.benefits import BenefitsData


class EstimateEngine:
    def calculate(self, charge_amount: Decimal, benefits: BenefitsData) -> dict:
        if not charge_amount or charge_amount <= 0:
            raise ValueError("charge_amount must be greater than zero")
        deductible = benefits.deductible_individual or Decimal("0")
        deductible_met = benefits.deductible_met or Decimal("0")
        coinsurance_pct = benefits.coinsurance_percentage or 0
        oop_max = benefits.oop_max

        remaining_deductible = max(Decimal("0"), deductible - deductible_met)

        # Patient pays deductible first, then coinsurance on the rest
        after_deductible = max(Decimal("0"), charge_amount - remaining_deductible)
        insurance_pays = after_deductible * Decimal(coinsurance_pct) / Decimal("100")
        patient_base = charge_amount - insurance_pays

        # Cap patient responsibility at OOP max if available
        if oop_max and patient_base > oop_max:
            patient_base = oop_max
            insurance_pays = charge_amount - patient_base

        # Confidence based on data completeness
        has_fields = sum([
            benefits.deductible_individual is not None,
            benefits.deductible_met is not None,
            benefits.coinsurance_percentage is not None,
            benefits.oop_max is not None,
        ])
        confidence = "high" if has_fields >= 3 else ("medium" if has_fields >= 2 else "low")

        # Range: +/- 10% for uncertainty
        margin = Decimal("0.10")
        reimbursement_low = (insurance_pays * (1 - margin)).quantize(Decimal("0.01"))
        reimbursement_high = (insurance_pays * (1 + margin)).quantize(Decimal("0.01"))
        oop_low = (patient_base * (1 - margin)).quantize(Decimal("0.01"))
        oop_high = (patient_base * (1 + margin)).quantize(Decimal("0.01"))

        return {
            "reimbursement_low": reimbursement_low,
            "reimbursement_high": reimbursement_high,
            "oop_low": oop_low,
            "oop_high": oop_high,
            "confidence": confidence,
            "details": {
                "charge_amount": str(charge_amount),
                "remaining_deductible": str(remaining_deductible),
                "after_deductible": str(after_deductible),
                "coinsurance_pct": coinsurance_pct,
                "insurance_pays_base": str(insurance_pays),
                "patient_pays_base": str(patient_base),
            },
        }
