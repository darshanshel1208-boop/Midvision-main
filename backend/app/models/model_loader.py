import os
import glob
from typing import Dict, List, Any

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")

class PreTrainedModelRegistry:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        self.loaded_models: Dict[str, Any] = {}

    def scan_available_models(self) -> List[Dict[str, Any]]:
        """
        Scans backend/models/ directory for local PyTorch (.pt, .pth), ONNX (.onnx),
        or TensorFlow (.h5, .pb) pre-trained model files.
        """
        model_files = []
        extensions = ["*.pt", "*.pth", "*.onnx", "*.h5", "*.safetensors", "*.bin"]
        
        for ext in extensions:
            for filepath in glob.glob(os.path.join(MODELS_DIR, "**", ext), recursive=True):
                rel_path = os.path.relative_path = os.path.relpath(filepath, MODELS_DIR)
                size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)
                model_files.append({
                    "filename": os.path.basename(filepath),
                    "relative_path": rel_path,
                    "size_mb": size_mb,
                    "format": os.path.splitext(filepath)[1].lower()
                })
        return model_files

    def get_status(self) -> Dict[str, Any]:
        """
        Returns registry summary and status.
        """
        models = self.scan_available_models()
        return {
            "models_directory": MODELS_DIR,
            "total_pretrained_models_found": len(models),
            "available_models": models,
            "loaded_in_memory": list(self.loaded_models.keys()),
            "status": "ready" if len(models) > 0 else "no_local_models_found_using_cloud_fallback"
        }

model_registry = PreTrainedModelRegistry()
