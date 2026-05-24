from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4


@dataclass
class S3Service:
    bucket_name: str = "smartinventory-dev"

    def upload_product_image(self, product_id: str, filename: str) -> str:
        object_key = f"products/{product_id}/{uuid4()}-{filename}"
        return f"https://fake-s3.local/{self.bucket_name}/{object_key}"

    def generate_fake_presigned_url(self, object_key: str, expires_in_seconds: int = 3600) -> str:
        return (
            f"https://fake-s3.local/{self.bucket_name}/{object_key}"
            f"?expires_in={expires_in_seconds}"
        )
