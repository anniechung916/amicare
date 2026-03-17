from twilio.rest import Client

from app.config import get_settings


class TwilioService:
    def __init__(self):
        settings = get_settings()
        self.account_sid = settings.twilio_account_sid
        self.auth_token = settings.twilio_auth_token
        self.from_number = settings.twilio_phone_number
        self.webhook_base = settings.twilio_webhook_base_url
        self._client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            if not self.account_sid or not self.auth_token:
                raise RuntimeError("Twilio credentials not configured")
            self._client = Client(self.account_sid, self.auth_token)
        return self._client

    def hangup_call(self, twilio_call_sid: str) -> None:
        """End an active Twilio call by SID."""
        self.client.calls(twilio_call_sid).update(status="completed")

    def send_dtmf(self, call_sid: str, digits: str) -> None:
        """Send DTMF tones to navigate an IVR menu during a live call."""
        self.client.calls(call_sid).update(
            twiml=f'<Response><Play digits="{digits}"/></Response>'
        )

    def transfer_call(self, call_sid: str, to_number: str) -> None:
        """Warm-transfer a live call to another number via Twilio <Dial>."""
        self.client.calls(call_sid).update(
            twiml=f'<Response><Dial>{to_number}</Dial></Response>'
        )

    def initiate_call(self, to_number: str, call_log_id: str) -> str:
        call = self.client.calls.create(
            to=to_number,
            from_=self.from_number,
            url=f"{self.webhook_base}/api/calls/twiml/{call_log_id}",
            status_callback=f"{self.webhook_base}/api/calls/status/{call_log_id}",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
            record=True,
            recording_status_callback=f"{self.webhook_base}/api/calls/recording/{call_log_id}",
        )
        return call.sid


twilio_service = TwilioService()
