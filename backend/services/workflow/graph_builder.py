# Blocker graph builder.
# Mirrors frontend/lib/graphBuilder.ts so the backend can return a graph
# in the shared schema: {"nodes": [...], "edges": [...]}.

from typing import Any

AT_LEAST_MODERATE = {"moderate", "medium_high", "high"}


def _node(id: str, label: str, status: str, owner: str) -> dict[str, str]:
    return {"id": id, "label": label, "status": status, "owner": owner}


def _level(categories: dict[str, Any], key: str) -> str | None:
    cat = categories.get(key) or {}
    return cat.get("level")


def build_graph(risk: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Derive the blocker graph from the risk analysis section.

    `risk` is the shared-schema risk object:
      {"score": int, "level": str, "categories": {...}, "reasons": [...]}
    """
    categories = risk.get("categories") or {}
    overall = risk.get("level")

    nodes = [_node("opportunity_uploaded", "Opportunity uploaded", "clear", "student")]
    edges: list[dict[str, str]] = []
    signal_ids: list[str] = []

    if _level(categories, "paid_role") in AT_LEAST_MODERATE:
        nodes.append(_node("paid_role", "Paid role detected", "warning", "organizer"))
        edges.append({"from": "opportunity_uploaded", "to": "paid_role"})
        signal_ids.append("paid_role")

    if _level(categories, "work_authorization") in AT_LEAST_MODERATE:
        nodes.append(
            _node("work_auth", "Work authorization may be required", "blocked", "student")
        )
        parent = "paid_role" if "paid_role" in signal_ids else "opportunity_uploaded"
        edges.append({"from": parent, "to": "work_auth"})
        signal_ids.append("work_auth")

    if _level(categories, "citizenship") == "high":
        nodes.append(
            _node(
                "citizenship_restricted",
                "Citizenship restriction detected",
                "blocked",
                "system",
            )
        )
        edges.append({"from": "opportunity_uploaded", "to": "citizenship_restricted"})
        signal_ids.append("citizenship_restricted")

    if _level(categories, "ambiguity") == "high":
        nodes.append(
            _node(
                "eligibility_unclear",
                "International eligibility unclear",
                "blocked",
                "system",
            )
        )
        parents = [s for s in signal_ids if s != "eligibility_unclear"]
        if not parents:
            edges.append({"from": "opportunity_uploaded", "to": "eligibility_unclear"})
        else:
            edges.extend({"from": p, "to": "eligibility_unclear"} for p in parents)
        signal_ids.append("eligibility_unclear")

    verification_needed = overall in {"high", "medium_high"}
    leaves = [signal_ids[-1]] if signal_ids else ["opportunity_uploaded"]

    if verification_needed:
        nodes.extend(
            [
                _node("organizer_verify", "Organizer verification needed", "pending", "organizer"),
                _node(
                    "advisor_verify",
                    "Advisor/DSO verification recommended",
                    "pending",
                    "advisor",
                ),
                _node(
                    "decision",
                    "Do not assume eligibility until confirmed",
                    "blocked",
                    "student",
                ),
            ]
        )
        for leaf in leaves:
            edges.append({"from": leaf, "to": "organizer_verify"})
            edges.append({"from": leaf, "to": "advisor_verify"})
        edges.append({"from": "organizer_verify", "to": "decision"})
        edges.append({"from": "advisor_verify", "to": "decision"})
    else:
        if signal_ids:
            nodes.append(
                _node("decision", "Verify remaining questions, then proceed", "warning", "student")
            )
        else:
            nodes.append(
                _node(
                    "decision",
                    "No major blockers detected — safe to proceed",
                    "clear",
                    "student",
                )
            )
        edges.extend({"from": leaf, "to": "decision"} for leaf in leaves)

    return {"nodes": nodes, "edges": edges}
