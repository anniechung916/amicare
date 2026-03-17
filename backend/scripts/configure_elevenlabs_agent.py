"""
One-time script to configure the ElevenLabs agent with:
  - send_dtmf client tool    (IVR navigation)
  - transfer_call client tool (warm transfer to office)
  - Updated system prompt     (IVR instructions + benefits_questions variable)

Run from the backend/ directory:
    python scripts/configure_elevenlabs_agent.py [--dry-run]

The script reads ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID from .env (or the
environment).  It fetches the current agent, merges the new tools/prompt
additions, then PATCHes the agent config.  Existing tools with the same name
are replaced; the rest are left unchanged.
"""
import argparse
import json
import os
import sys

import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
AGENT_ID = os.environ.get("ELEVENLABS_AGENT_ID", "")
BASE = "https://api.elevenlabs.io/v1"

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

SEND_DTMF_TOOL = {
    "type": "client",
    "name": "send_dtmf",
    "description": (
        "Send a DTMF keypress tone to navigate an automated phone menu (IVR). "
        "Use this when you hear a menu prompt such as 'Press 1 for benefits' or "
        "'Press 2 for eligibility'. Determine the correct digit from the menu "
        "options and press whatever gets us to benefits verification or a live agent."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "digit": {
                "type": "string",
                "description": "The digit to press (0-9, *, or #)",
            }
        },
        "required": ["digit"],
    },
}

TRANSFER_CALL_TOOL = {
    "type": "client",
    "name": "transfer_call",
    "description": (
        "Transfer the call to a human representative from our office. "
        "Use this ONLY if the insurance representative explicitly asks to speak "
        "with an actual person from our office, or if you cannot proceed with "
        "benefits verification without a human present."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "reason": {
                "type": "string",
                "description": "Brief reason for the transfer",
            }
        },
        "required": ["reason"],
    },
}

NEW_TOOLS = [SEND_DTMF_TOOL, TRANSFER_CALL_TOOL]

# ---------------------------------------------------------------------------
# System-prompt additions (prepended to whatever is already there)
# ---------------------------------------------------------------------------

PROMPT_PREFIX = """\
You are an AI calling an insurance company on behalf of a healthcare provider \
to verify patient benefits. You speak professionally and concisely.

IVR NAVIGATION: When you hear an automated phone menu, use the send_dtmf tool \
to press the digit that leads to benefits/eligibility verification or a live \
representative. Common paths: press the option for "benefits", \
"eligibility", or "speak to a representative". Do not say you are pressing a \
button — just call the tool silently and continue.

BENEFITS QUESTIONS: Once you reach a human representative, ask the following \
questions in a natural, conversational manner:
{{benefits_questions}}

WARM TRANSFER: If the insurance representative requests to speak with a human \
from our office, use the transfer_call tool immediately.

"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def headers():
    return {"xi-api-key": API_KEY, "Content-Type": "application/json"}


def get_agent():
    r = httpx.get(f"{BASE}/convai/agents/{AGENT_ID}", headers=headers(), timeout=15)
    r.raise_for_status()
    return r.json()


def patch_agent(payload: dict):
    r = httpx.patch(
        f"{BASE}/convai/agents/{AGENT_ID}",
        headers=headers(),
        json=payload,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def merge_tools(existing: list, new: list) -> list:
    """Replace tools with matching names; append the rest."""
    new_names = {t["name"] for t in new}
    kept = [t for t in existing if t.get("name") not in new_names]
    return kept + new


def build_prompt(existing: str) -> str:
    """Prepend our instructions only if not already present."""
    marker = "IVR NAVIGATION:"
    if marker in existing:
        print("  System prompt already contains IVR instructions — skipping prefix.")
        return existing
    return PROMPT_PREFIX + existing


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Configure ElevenLabs agent for Amicare")
    parser.add_argument("--dry-run", action="store_true", help="Print the payload without sending it")
    args = parser.parse_args()

    if not API_KEY:
        sys.exit("ERROR: ELEVENLABS_API_KEY not set")
    if not AGENT_ID:
        sys.exit("ERROR: ELEVENLABS_AGENT_ID not set")

    print(f"Fetching agent {AGENT_ID} ...")
    agent = get_agent()

    # Navigate the nested structure
    conv_cfg = agent.get("conversation_config", {})
    agent_cfg = conv_cfg.get("agent", {})
    prompt_cfg = agent_cfg.get("prompt", {})

    existing_tools = prompt_cfg.get("tools", [])
    existing_prompt = prompt_cfg.get("prompt", "")

    print(f"  Existing tools: {[t.get('name') for t in existing_tools]}")
    print(f"  Existing prompt length: {len(existing_prompt)} chars")

    merged_tools = merge_tools(existing_tools, NEW_TOOLS)
    new_prompt = build_prompt(existing_prompt)

    print(f"  Merged tools: {[t.get('name') for t in merged_tools]}")

    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    **prompt_cfg,
                    "prompt": new_prompt,
                    "tools": merged_tools,
                }
            }
        }
    }

    if args.dry_run:
        print("\n--- DRY RUN — payload that would be sent ---")
        print(json.dumps(payload, indent=2))
        return

    print("Patching agent ...")
    result = patch_agent(payload)
    print(f"Done. Agent name: {result.get('name')}")
    updated_tools = (
        result.get("conversation_config", {})
        .get("agent", {})
        .get("prompt", {})
        .get("tools", [])
    )
    print(f"Tools now configured: {[t.get('name') for t in updated_tools]}")


if __name__ == "__main__":
    main()
