from flask import Blueprint, request, jsonify, redirect
from integrations.google.auth import GoogleAuthService
from schemas import ErrorResponse, OAuthResponse

google_auth_bp = Blueprint("google_auth", __name__, url_prefix="/api/google")
auth_service = GoogleAuthService()


@google_auth_bp.route("/auth/start", methods=["GET"])
def start_auth():
    url = auth_service.get_authorization_url()
    return redirect(url)


@google_auth_bp.route("/auth/callback", methods=["GET"])
def auth_callback():
    code = request.args.get("code")
    state = request.args.get("state")
    if not code:
        return jsonify(ErrorResponse(error="Missing code").model_dump()), 400
    if not state:
        return jsonify(ErrorResponse(error="Missing state").model_dump()), 400
    try:
        result = auth_service.handle_callback(code, state)
    except Exception as e:
        return jsonify(ErrorResponse(error="OAuth callback failed", details=str(e)).model_dump()), 500
    return jsonify(OAuthResponse.model_validate(result).model_dump()), 200
