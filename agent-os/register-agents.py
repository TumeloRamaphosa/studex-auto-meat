#!/usr/bin/env python3
"""
One-time Agent Registration Script
Registers all StudEx agents with Dograh orchestrator
"""

import requests
import json
import sys

DOGRAH_ENDPOINT = "http://localhost:8000"

AGENTS_TO_REGISTER = [
    {
        "name": "Naledi",
        "endpoint": "http://localhost:5000/naledi",
        "capabilities": ["content_creation", "interviewing", "social_media", "brand_voice"],
        "role": "cmo"
    },
    {
        "name": "RALF",
        "endpoint": "http://localhost:5001/ralf",
        "capabilities": ["coordination", "loop_management", "task_scheduling"],
        "role": "coordinator"
    },
    {
        "name": "OpenHands",
        "endpoint": "http://localhost:5002/openhands",
        "capabilities": ["coding", "development", "testing", "debugging"],
        "role": "developer"
    },
    {
        "name": "Herds",
        "endpoint": "http://localhost:5004/herds",
        "capabilities": ["multi_step_tasks", "complex_workflows", "reasoning"],
        "role": "developer"
    },
    {
        "name": "Hermes",
        "endpoint": "http://localhost:8081",
        "capabilities": ["messaging", "email", "notifications", "routing"],
        "role": "messaging"
    },
    {
        "name": "Evaluator",
        "endpoint": "http://localhost:5003/evaluator",
        "capabilities": ["scoring", "assessment", "reasoning", "feedback"],
        "role": "evaluator"
    },
    {
        "name": "DenchClaw",
        "endpoint": "http://localhost:8082",
        "capabilities": ["crm", "leads", "pipeline", "contacts"],
        "role": "crm"
    },
    {
        "name": "CashClaw",
        "endpoint": "http://localhost:8083",
        "capabilities": ["payments", "invoicing", "financial", "reporting"],
        "role": "finance"
    }
]

def register_agents():
    """Register all agents with Dograh"""
    
    print("=" * 60)
    print("AGENT REGISTRATION — StudEx Auto-Meat + Paperclip OS")
    print("=" * 60)
    print(f"\nTarget: {DOGRAH_ENDPOINT}")
    print(f"Agents to register: {len(AGENTS_TO_REGISTER)}\n")
    
    registered = []
    failed = []
    
    for agent in AGENTS_TO_REGISTER:
        try:
            print(f"Registering {agent['name']}...", end=" ")
            
            resp = requests.post(
                f"{DOGRAH_ENDPOINT}/register_agent",
                json=agent,
                timeout=5
            )
            
            if resp.status_code == 200:
                result = resp.json()
                print(f"✓ {result.get('agent_id')}")
                registered.append(agent['name'])
            else:
                print(f"✗ HTTP {resp.status_code}")
                failed.append(agent['name'])
        
        except Exception as e:
            print(f"✗ {str(e)}")
            failed.append(agent['name'])
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Registered: {len(registered)}/{len(AGENTS_TO_REGISTER)}")
    
    if registered:
        print("\n✓ Success:")
        for name in registered:
            print(f"  • {name}")
    
    if failed:
        print("\n✗ Failed:")
        for name in failed:
            print(f"  • {name}")
    
    print("\n" + "=" * 60)
    
    return len(failed) == 0

if __name__ == "__main__":
    success = register_agents()
    sys.exit(0 if success else 1)
