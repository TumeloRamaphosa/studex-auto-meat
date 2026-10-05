#!/usr/bin/env python3
"""
Paperclip Bridge: Connect Dograh ↔ StudEx Agent Registry
Routes tasks between Paperclip OS and existing agents
"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any

DOGRAH_ENDPOINT = "http://localhost:8000"
AGENT_REGISTRY = {
    "naledi": {
        "endpoint": "http://localhost:5000/naledi",
        "model": "qwen2.5-14b",
        "capabilities": ["content_creation", "interviewing", "social_media"]
    },
    "ralf": {
        "endpoint": "http://localhost:5001/ralf",
        "model": "gemma-4",
        "capabilities": ["coordination", "scheduling", "routing"]
    },
    "openhands": {
        "endpoint": "http://localhost:5002/openhands",
        "model": "qwen3-14b",
        "capabilities": ["coding", "development", "analysis"]
    },
    "hermes": {
        "endpoint": "http://localhost:8081",
        "model": "gemma-4",
        "capabilities": ["messaging", "email", "notifications"]
    },
    "evaluator": {
        "endpoint": "http://localhost:5003/evaluator",
        "model": "qwen3-14b",
        "capabilities": ["scoring", "assessment", "reasoning"]
    }
}

class PaperclipBridge:
    def __init__(self):
        self.dograh = DOGRAH_ENDPOINT
        self.registry = AGENT_REGISTRY
    
    def register_agents(self):
        """Register all StudEx agents with Dograh (one-time)"""
        for agent_name, agent_config in self.registry.items():
            payload = {
                "name": agent_name,
                "endpoint": agent_config["endpoint"],
                "capabilities": agent_config["capabilities"],
                "role": agent_name
            }
            
            try:
                resp = requests.post(f"{self.dograh}/register_agent", json=payload)
                print(f"✓ Registered {agent_name}: {resp.json()}")
            except Exception as e:
                print(f"✗ Failed to register {agent_name}: {e}")
    
    def submit_interview_task(self, 
                            candidate_name: str,
                            candidate_email: str,
                            role: str,
                            round_num: int,
                            interview_type: str = "technical") -> Dict[str, Any]:
        """
        Submit interview task to Dograh
        Dograh routes to Naledi (interviewer) + Evaluator (scorer)
        """
        
        payload = {
            "name": f"Interview: {candidate_name} - {interview_type} (Round {round_num})",
            "agent_type": "multi_agent",
            "priority": 8,
            "context": {
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                "role": role,
                "round": round_num,
                "interview_type": interview_type,
                "agents_needed": ["naledi", "evaluator"],
                "submitted_at": datetime.utcnow().isoformat()
            }
        }
        
        try:
            resp = requests.post(f"{self.dograh}/task/submit", json=payload)
            task_data = resp.json()
            print(f"✓ Interview task submitted: {task_data.get('task_id')}")
            return task_data
        except Exception as e:
            print(f"✗ Failed to submit interview: {e}")
            return {"error": str(e)}
    
    def check_task_status(self, task_id: str) -> Dict[str, Any]:
        """Check Dograh task status"""
        try:
            resp = requests.get(f"{self.dograh}/task/{task_id}")
            return resp.json()
        except Exception as e:
            return {"error": str(e)}
    
    def route_to_agent(self, agent_name: str, task: Dict[str, Any]) -> Optional[Dict]:
        """Route task directly to specific agent"""
        if agent_name not in self.registry:
            return {"error": f"Agent {agent_name} not found"}
        
        agent_config = self.registry[agent_name]
        
        try:
            resp = requests.post(
                f"{agent_config['endpoint']}/task",
                json=task,
                timeout=10
            )
            return resp.json()
        except Exception as e:
            return {"error": str(e)}
    
    def broadcast_to_agents(self, agents: list, task: Dict[str, Any]):
        """Send task to multiple agents simultaneously"""
        results = {}
        for agent_name in agents:
            results[agent_name] = self.route_to_agent(agent_name, task)
        return results

def main():
    bridge = PaperclipBridge()
    
    # 1. Register agents (one-time)
    print("Registering agents with Dograh...")
    bridge.register_agents()
    
    # 2. Test interview submission
    print("\nSubmitting test interview...")
    result = bridge.submit_interview_task(
        candidate_name="Jane Doe",
        candidate_email="jane@example.com",
        role="Senior Engineer",
        round_num=2,
        interview_type="technical"
    )
    
    if "task_id" in result:
        task_id = result["task_id"]
        
        # 3. Check status
        print(f"\nChecking task status for {task_id}...")
        status = bridge.check_task_status(task_id)
        print(f"Status: {status}")

if __name__ == "__main__":
    main()
