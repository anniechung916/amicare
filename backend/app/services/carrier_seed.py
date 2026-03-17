import uuid

SEED_CARRIERS = [
    {
        "carrier_key": "uhc",
        "name": "UnitedHealthcare",
        "display_name": "UnitedHealthcare (UHC)",
        "category": "National",
        "phone_numbers": {
            "customer_service": "1-866-414-1959",
            "oon_benefits_verification": "1-866-414-1959",
            "claims_status": "1-866-414-1959",
            "provider_services": "1-800-842-3211",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 1 (Members) -> 2 (Benefits) -> 0 (Representative)",
            "claims_status": "Press 1 (Members) -> 3 (Claims) -> 0 (Representative)",
            "notes": "Often asks for member ID before routing",
        },
        "required_info": ["Member ID", "Group Number", "Date of Birth", "Provider NPI (sometimes)"],
        "avg_hold_time_minutes": 15,
        "reference_number_format": "SR followed by 10-12 digits",
        "common_questions": [
            "What is the member's date of birth?",
            "What is your relationship to the member?",
            "What is the date of service?",
            "What type of provider are you inquiring about?",
        ],
        "reimbursement_methods": ["UCR (Usual, Customary, and Reasonable)", "Percentage of Medicare"],
        "script_notes": "UHC reps often try to redirect to online portal. Politely insist on phone verification. Ask specifically for 'out-of-network benefits' not just 'benefits'.",
        "special_considerations": "May require verbal authorization from member if calling on their behalf",
    },
    {
        "carrier_key": "anthem",
        "name": "Anthem Blue Cross Blue Shield",
        "display_name": "Anthem BCBS",
        "category": "National",
        "phone_numbers": {
            "customer_service": "1-800-331-1476",
            "oon_benefits_verification": "1-800-331-1476",
            "claims_status": "1-800-331-1476",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 1 (English) -> 1 (Member) -> 3 (Benefits) -> 0 (Representative)",
            "notes": "May ask for ZIP code for routing",
        },
        "required_info": ["Member ID (starts with XYZ or W)", "Date of Birth", "ZIP Code"],
        "avg_hold_time_minutes": 20,
        "reference_number_format": "10-digit numerical reference",
        "common_questions": [
            "Member ZIP code?",
            "Reason for out-of-network visit?",
            "Is this for a specific claim or general benefits?",
        ],
        "reimbursement_methods": ["R&C (Reasonable and Customary)", "UCR"],
        "script_notes": "Anthem often has regional variations (Anthem CA vs Anthem NY). Confirm which regional plan. They frequently cite deductibles; ask specifically about coinsurance percentage.",
        "special_considerations": "Different regions have different policies - confirm state",
    },
    {
        "carrier_key": "aetna",
        "name": "Aetna",
        "display_name": "Aetna",
        "category": "National",
        "phone_numbers": {
            "customer_service": "1-800-872-3862",
            "oon_benefits_verification": "1-800-872-3862",
            "claims_status": "1-800-872-3862",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 1 (Member) -> 1 (Benefits/Claims) -> Stay on line for rep",
            "notes": "Sometimes routes by member ID prefix",
        },
        "required_info": ["Member ID", "Date of Birth", "Last 4 of SSN (sometimes)"],
        "avg_hold_time_minutes": 12,
        "reference_number_format": "Alphanumeric, often starts with 'RN'",
        "common_questions": [
            "Is this regarding a specific claim?",
            "What is the CPT code?",
            "Has the member met their deductible?",
        ],
        "reimbursement_methods": ["Medicare-based percentage (often 140% of Medicare)", "UCR"],
        "script_notes": "Aetna reps are generally efficient. They often provide detailed breakdowns. Ask for 'allowed amount' calculation method specifically.",
        "special_considerations": "CVS-owned; may push Minute Clinic alternatives",
    },
    {
        "carrier_key": "cigna",
        "name": "Cigna",
        "display_name": "Cigna",
        "category": "National",
        "phone_numbers": {
            "customer_service": "1-800-244-6224",
            "oon_benefits_verification": "1-800-244-6224",
            "claims_status": "1-800-997-1654",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 2 (Current member) -> 1 (Benefits) -> 0 (Representative)",
            "claims_status": "Call claims number, press 1 -> enter claim number or press 0",
        },
        "required_info": ["Member ID", "Date of Birth", "Group Number"],
        "avg_hold_time_minutes": 18,
        "reference_number_format": "Numeric, 10-12 digits",
        "common_questions": [
            "Is this a PPO or HMO plan?",
            "What specialty provider?",
            "Pre-authorization obtained?",
        ],
        "reimbursement_methods": ["R&C database", "Percentage of Medicare"],
        "script_notes": "Cigna often requires pre-authorization for certain OON services. Always ask. They may quote 'maximum reimbursable charge' - get the actual percentage.",
        "special_considerations": "Strong pre-auth requirements for OON",
    },
    {
        "carrier_key": "bcbs_generic",
        "name": "Blue Cross Blue Shield",
        "display_name": "Blue Cross Blue Shield (Generic)",
        "category": "Regional",
        "phone_numbers": {
            "customer_service": "See member card - varies by state",
            "oon_benefits_verification": "1-800-810-2583 (national)",
            "claims_status": "See member card",
        },
        "ivr_navigation": {
            "benefits_verification": "Varies by state plan",
            "notes": "BCBS is a federation - each state is independent",
        },
        "required_info": ["Member ID (prefix indicates state)", "Date of Birth", "State of coverage"],
        "avg_hold_time_minutes": 25,
        "reference_number_format": "Varies by state",
        "common_questions": [
            "Which state BCBS plan?",
            "Member or dependent?",
            "Employer group?",
        ],
        "reimbursement_methods": ["Varies by state - often UCR or R&C"],
        "script_notes": "CRITICAL: Identify the specific state BCBS (e.g., BCBS Michigan, BCBS Texas). Policies vary wildly. The member ID prefix tells you the state.",
        "special_considerations": "Each state BCBS is a separate company with different policies",
    },
    {
        "carrier_key": "humana",
        "name": "Humana",
        "display_name": "Humana",
        "category": "National",
        "phone_numbers": {
            "customer_service": "1-800-448-6262",
            "oon_benefits_verification": "1-800-448-6262",
            "claims_status": "1-800-448-6262",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 1 (Member) -> 2 (Benefits) -> 0 (Representative)",
            "notes": "May ask for member ID via IVR",
        },
        "required_info": ["Member ID", "Date of Birth"],
        "avg_hold_time_minutes": 22,
        "reference_number_format": "Alphanumeric reference number",
        "common_questions": [
            "Is this a Medicare Advantage plan?",
            "Commercial or employer plan?",
            "Provider taxonomy code?",
        ],
        "reimbursement_methods": ["Medicare rates (for MA plans)", "UCR (for commercial)"],
        "script_notes": "Humana has many Medicare Advantage plans. Confirm if commercial or MA. MA plans have different OON rules. Reps often transfer between departments.",
        "special_considerations": "Heavy Medicare Advantage presence - OON benefits very limited on MA plans",
    },
    {
        "carrier_key": "kaiser",
        "name": "Kaiser Permanente",
        "display_name": "Kaiser Permanente",
        "category": "Regional HMO",
        "phone_numbers": {
            "customer_service": "1-800-464-4000 (varies by region)",
            "oon_benefits_verification": "1-800-464-4000",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 2 (Current member) -> Say 'representative'",
            "notes": "Regional numbers differ (Northern CA, Southern CA, etc.)",
        },
        "required_info": ["Member ID", "Medical Record Number (MRN)"],
        "avg_hold_time_minutes": 30,
        "reference_number_format": "Service request number",
        "common_questions": [
            "Why OON instead of Kaiser facility?",
            "Was this an emergency?",
            "Did member get prior authorization?",
        ],
        "reimbursement_methods": ["Emergency OON only in most cases", "Limited UCR for authorized OON"],
        "script_notes": "CRITICAL: Kaiser is HMO. OON benefits are VERY limited - usually emergency only or authorized exceptions. Don't promise reimbursement. Verify if they have a non-Kaiser supplemental plan.",
        "special_considerations": "HMO model - typically NO out-of-network coverage except emergencies",
    },
    {
        "carrier_key": "oxford",
        "name": "Oxford Health Plans",
        "display_name": "Oxford Health Plans (UHC subsidiary)",
        "category": "Regional",
        "phone_numbers": {
            "customer_service": "1-800-444-6222",
            "oon_benefits_verification": "1-800-444-6222",
        },
        "ivr_navigation": {
            "benefits_verification": "Press 1 (Member) -> 2 (Benefits) -> 0",
            "notes": "Now owned by UnitedHealthcare",
        },
        "required_info": ["Member ID", "Date of Birth", "Group Number"],
        "avg_hold_time_minutes": 18,
        "reference_number_format": "Similar to UHC format",
        "common_questions": [
            "Oxford EPO, PPO, or Freedom plan?",
            "NY/NJ/CT resident?",
        ],
        "reimbursement_methods": ["UCR", "Medicare percentage"],
        "script_notes": "Oxford has EPO plans (no OON except emergency) and PPO plans (OON allowed). Confirm plan type FIRST. Strong in NY/NJ/CT tristate area.",
        "special_considerations": "EPO plans have NO out-of-network benefits",
    },
    {
        "carrier_key": "multiplan",
        "name": "MultiPlan",
        "display_name": "MultiPlan (PHCS/Private Healthcare Systems)",
        "category": "Network Only",
        "phone_numbers": {
            "customer_service": "1-800-677-1116",
            "oon_benefits_verification": "Contact primary insurer",
        },
        "ivr_navigation": {
            "notes": "MultiPlan is a PPO network, not an insurance carrier. Members have a primary carrier.",
        },
        "required_info": ["Primary carrier information", "Member ID"],
        "avg_hold_time_minutes": None,
        "reference_number_format": "N/A - not a claims payer",
        "common_questions": [],
        "reimbursement_methods": ["Determined by primary carrier"],
        "script_notes": "IMPORTANT: If member says 'MultiPlan' or 'PHCS', ask WHO their actual insurance carrier is. MultiPlan is just a network - there's a primary insurer behind it (often self-funded employers). Call that carrier.",
        "special_considerations": "Not an insurance company - it's a PPO network used by self-funded plans",
    },
    {
        "carrier_key": "custom",
        "name": "Custom/Other Carrier",
        "display_name": "Other Insurance Carrier (Add Custom)",
        "category": "Custom",
        "phone_numbers": {},
        "ivr_navigation": {"notes": "User will input carrier-specific details"},
        "required_info": [],
        "avg_hold_time_minutes": None,
        "reference_number_format": "",
        "common_questions": [],
        "reimbursement_methods": [],
        "script_notes": "Research this carrier and document findings for future use.",
        "special_considerations": "",
    },
]


async def seed_carriers(db):
    from sqlalchemy import select
    from app.models.carrier import InsuranceCarrier

    result = await db.execute(select(InsuranceCarrier).limit(1))
    if result.scalar_one_or_none():
        return  # Already seeded

    for data in SEED_CARRIERS:
        carrier = InsuranceCarrier(**data)
        db.add(carrier)

    await db.commit()
