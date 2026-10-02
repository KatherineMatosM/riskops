def compute_risk_score(probability: int, impact: int) -> int:
    return probability * impact


def classify_risk_level(score: int) -> str:
    if score <= 4:
        return "LOW"
    if score <= 9:
        return "MEDIUM"
    if score <= 16:
        return "HIGH"
    return "CRITICAL"