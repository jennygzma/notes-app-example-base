from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.folder_service import FolderService
from schemas import (
    CreateFolderRequest,
    UpdateFolderRequest,
    Folder,
    FolderListResponse,
    ErrorResponse
)

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
folder_service = FolderService()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = folder_service.get_folders()
    return jsonify(FolderListResponse(folders=folders).model_dump()), 200


@folders_bp.route('/', methods=['POST'])
def create_folder():
    try:
        data = CreateFolderRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    folder = folder_service.create_folder(
        name=data.name,
        description=data.description,
        color=data.color
    )
    return jsonify(Folder.model_validate(folder).model_dump()), 201


@folders_bp.route('/<folder_id>/', methods=['GET'])
def get_folder(folder_id: str):
    folder = folder_service.get_folder(folder_id)
    if not folder:
        return jsonify(ErrorResponse(error="Folder not found").model_dump()), 404
    return jsonify(Folder.model_validate(folder).model_dump()), 200


@folders_bp.route('/<folder_id>/', methods=['PUT'])
def update_folder(folder_id: str):
    try:
        data = UpdateFolderRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    folder = folder_service.update_folder(
        folder_id=folder_id,
        name=data.name,
        description=data.description,
        color=data.color
    )
    
    if not folder:
        return jsonify(ErrorResponse(error="Folder not found").model_dump()), 404
    return jsonify(Folder.model_validate(folder).model_dump()), 200


@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id: str):
    success = folder_service.delete_folder(folder_id)
    if not success:
        return jsonify(ErrorResponse(error="Folder not found").model_dump()), 404
    return '', 204
