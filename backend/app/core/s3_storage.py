import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.config import settings

logger = logging.getLogger(__name__)

class S3DocumentStorage:
    """Gestionnaire de persistance et d'archivage des documents sources sur Amazon S3."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if not settings.DOCUMENTS_S3_BUCKET:
            return None
        if self._client is None:
            try:
                boto_kwargs = {"region_name": settings.AWS_REGION}
                if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                    boto_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                    boto_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
                    if settings.AWS_SESSION_TOKEN:
                        boto_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
                self._client = boto3.client("s3", **boto_kwargs)
                logger.info(f"Client S3 initialisé pour le bucket {settings.DOCUMENTS_S3_BUCKET}")
            except Exception as e:
                logger.warning(f"Échec d'initialisation du client S3: {e}")
                return None
        return self._client

    def upload_file(self, local_path: str, filename: str) -> bool:
        """Téléverse un fichier local sur S3 sous le préfixe documents/."""
        client = self._get_client()
        if not client or not settings.DOCUMENTS_S3_BUCKET:
            return False

        key = f"documents/{filename}"
        try:
            client.upload_file(local_path, settings.DOCUMENTS_S3_BUCKET, key)
            logger.info(f"Fichier archivé sur S3 : s3://{settings.DOCUMENTS_S3_BUCKET}/{key}")
            return True
        except (ClientError, NoCredentialsError, Exception) as e:
            logger.error(f"Erreur d'archivage S3 pour {filename}: {e}")
            return False

    def upload_bytes(self, content: bytes, filename: str) -> bool:
        """Téléverse des données brutes en bytes sur S3 sous le préfixe documents/."""
        client = self._get_client()
        if not client or not settings.DOCUMENTS_S3_BUCKET:
            return False

        key = f"documents/{filename}"
        try:
            client.put_object(
                Bucket=settings.DOCUMENTS_S3_BUCKET,
                Key=key,
                Body=content
            )
            logger.info(f"Contenu archivé sur S3 : s3://{settings.DOCUMENTS_S3_BUCKET}/{key}")
            return True
        except (ClientError, NoCredentialsError, Exception) as e:
            logger.error(f"Erreur d'archivage S3 pour {filename}: {e}")
            return False

    def delete_document(self, filename: str) -> bool:
        """Supprime un document du bucket S3."""
        client = self._get_client()
        if not client or not settings.DOCUMENTS_S3_BUCKET:
            return False

        key = f"documents/{filename}"
        try:
            client.delete_object(Bucket=settings.DOCUMENTS_S3_BUCKET, Key=key)
            logger.info(f"Document supprimé de S3 : s3://{settings.DOCUMENTS_S3_BUCKET}/{key}")
            return True
        except (ClientError, NoCredentialsError, Exception) as e:
            logger.error(f"Erreur lors de la suppression S3 pour {filename}: {e}")
            return False


s3_storage = S3DocumentStorage()
