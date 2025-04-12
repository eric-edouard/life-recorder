# # Welcome to Cloud Functions for Firebase for Python!
# # To get started, simply uncomment the below code or create your own.
# # Deploy with `firebase deploy`

# from firebase_functions import storage_fn, logger
# from firebase_admin import initialize_app, storage
# import pathlib

# initialize_app()


# @storage_fn.on_object_archived(
#     region="europe-west4", bucket="personal-projects-456407.firebasestorage.app"
# )
# def log_object_archived(event: storage_fn.CloudEvent[storage_fn.StorageObjectData]):
#     bucket_name = event.data.bucket
#     file_path = pathlib.PurePath(event.data.name)
#     content_type = event.data.content_type

#     logger.info(f"Bucket: {bucket_name}")
#     logger.info(f"File: {file_path}")
#     logger.info(f"Content type: {content_type}")

#     return
