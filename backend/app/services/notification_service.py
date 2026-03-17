import logging

from app.config import get_settings
from app.models.ticket import Ticket

logger = logging.getLogger("amicare.notifications")


class NotificationService:
    def _estimate_url(self, share_token: str) -> str:
        settings = get_settings()
        return f"{settings.app_base_url}/estimate/{share_token}"

    async def send_estimate_notification(self, ticket: Ticket) -> None:
        """Send SMS and/or email to patient with their estimate link. Skips gracefully if contact info missing."""
        if not ticket.share_token:
            logger.warning(f"Ticket {ticket.id} has no share_token — skipping notification")
            return

        url = self._estimate_url(ticket.share_token)
        first_name = ticket.patient_name.split()[0] if ticket.patient_name else "there"

        if ticket.patient_phone:
            await self._send_sms(ticket.patient_phone, first_name, url, ticket.insurance_company)

        if ticket.patient_email:
            await self._send_email(ticket.patient_email, first_name, url, ticket.insurance_company, ticket.provider_name)

        if not ticket.patient_phone and not ticket.patient_email:
            logger.info(f"Ticket {ticket.id} has no patient phone or email — no notification sent")

    async def _send_sms(self, to: str, first_name: str, url: str, insurer: str) -> None:
        settings = get_settings()
        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            logger.warning("Twilio not configured — skipping SMS")
            return
        try:
            from twilio.rest import Client
            import asyncio
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            body = (
                f"Hi {first_name}! Your out-of-network cost estimate from {insurer} is ready. "
                f"Tap to view and submit your claim: {url}"
            )
            await asyncio.to_thread(
                client.messages.create,
                body=body,
                from_=settings.twilio_phone_number,
                to=to,
            )
            logger.info(f"SMS sent to {to}")
        except Exception as e:
            logger.error(f"SMS failed to {to}: {e}")

    async def _send_email(self, to: str, first_name: str, url: str, insurer: str, provider: str | None) -> None:
        settings = get_settings()
        if not settings.resend_api_key:
            logger.warning("Resend not configured — skipping email")
            return
        try:
            import resend
            import asyncio
            resend.api_key = settings.resend_api_key
            provider_line = f"from {provider}" if provider else ""
            html = f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
              <div style="font-size: 22px; font-weight: 700; color: #4f46e5; margin-bottom: 24px;">AmiCare</div>
              <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Hi {first_name}, your estimate is ready</h1>
              <p style="color: #555; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
                Your out-of-network cost estimate for your visit {provider_line} has been verified with {insurer}.
                Tap below to view your personalized cost breakdown and submit your claim — no account needed.
              </p>
              <a href="{url}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none;
                padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                View My Estimate &amp; Submit Claim →
              </a>
              <p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">
                This link is unique to you. AmiCare helps patients understand and submit out-of-network insurance claims.
              </p>
            </div>
            """
            await asyncio.to_thread(
                resend.Emails.send,
                {
                    "from": settings.notification_from_email,
                    "to": [to],
                    "subject": f"Your cost estimate is ready — {insurer}",
                    "html": html,
                }
            )
            logger.info(f"Email sent to {to}")
        except Exception as e:
            logger.error(f"Email failed to {to}: {e}")


notification_service = NotificationService()
