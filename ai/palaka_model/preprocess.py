# palaka_model/preprocess.py
from pydantic import ValidationError
from .schema import PredictRequest

def validate_payload(payload: dict) -> tuple:
    """
    Validates Next.js payload. Returns (is_valid, validated_data, error_dict)
    """
    try:
        # Pydantic will auto-check types, missing fields, and handle aliases
        valid_request = PredictRequest(**payload)
        return True, valid_request.inputs.model_dump(), None
        
    except ValidationError as e:
        # Extract meaningful missing fields or type errors
        missing_fields = []
        type_errors = {}
        for error in e.errors():
            field_name = error['loc'][-1]
            if error['type'] == 'missing':
                missing_fields.append(field_name)
            else:
                type_errors[field_name] = error['msg']
                
        error_resp = {
            "status": "error",
            "error": {
                "code": "VALIDATION_FAILED",
                "message": "Input payload failed schema validation.",
                "details": {
                    "missing_fields": missing_fields,
                    "type_errors": type_errors
                }
            }
        }
        return False, None, error_resp

def get_soft_validation_warnings(inputs: dict) -> list:
    """Check numerical ranges (Soft Validation) without breaking the flow."""
    warnings = []
    if not (3.0 <= inputs.get('water_ph', 7.0) <= 8.0):
        warnings.append("warning_water_ph_out_of_range")
    if inputs.get('water_hardness_ppm', 50.0) < 5.0:
        warnings.append("soft_water_warning")
    elif inputs.get('water_hardness_ppm', 50.0) > 100.0:
        warnings.append("hard_water_warning")
    return warnings

