# palaka_model/qc_rules.py

def generate_qc_flags(inputs: dict, predicted_acidity: float, predicted_off_flavor: float) -> list:
    """Evaluate inputs and stage-1 predictions to generate operational QC flags."""
    flags = []
    
    # 1. Soft Validation Warnings (จาก Schema v0.2)
    if inputs.get('water_ph', 7.0) < 3.0 or inputs.get('water_ph', 7.0) > 8.0:
        flags.append("warning_water_ph_out_of_range")
        
    if inputs.get('water_hardness_ppm', 50.0) < 5.0:
        flags.append("soft_water_warning")
    elif inputs.get('water_hardness_ppm', 50.0) > 100.0:
        flags.append("hard_water_warning")
        
    # 2. Risk Flags (จาก Model Predictions)
    if predicted_acidity > 1.8:
        flags.append("high_acidity_risk")
        
    if predicted_off_flavor > 0.5:
        flags.append("high_off_flavor_probability")
        
    return flags

