import threading
import time
import datetime
from config import SIGNUP_OTPS_COLLECTION, PASSWORD_RESET_OTPS_COLLECTION

def cleanup_old_otps(days=30):
    """
    Remove OTP records older than specified days (default 30 days)
    from both signup_otps and password_reset_otps collections.
    """
    try:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        signup_res = SIGNUP_OTPS_COLLECTION.delete_many({"created_at": {"$lt": cutoff}})
        reset_res = PASSWORD_RESET_OTPS_COLLECTION.delete_many({"created_at": {"$lt": cutoff}})
        print(f"[OTP Scheduler] Cleaned up {signup_res.deleted_count} signup OTPs and {reset_res.deleted_count} reset OTPs older than {days} days.")
    except Exception as e:
        print(f"[OTP Scheduler] Error during OTP cleanup: {e}")

def _run_scheduler():
    # Run once on startup after 5 seconds delay
    time.sleep(5)
    cleanup_old_otps(30)
    
    # Run daily (every 24 hours = 86400 seconds)
    while True:
        try:
            time.sleep(86400)
            cleanup_old_otps(30)
        except Exception as e:
            print(f"[OTP Scheduler Loop Error]: {e}")
            time.sleep(3600)

def start_otp_cleanup_scheduler():
    """
    Starts the daily OTP cleanup scheduler as a background daemon thread.
    """
    try:
        # Also ensure TTL indexes in MongoDB for extra safety
        # If MongoDB TTL thread is active, it will also handle documents automatically
        try:
            SIGNUP_OTPS_COLLECTION.create_index("created_at", expireAfterSeconds=30*86400)
            PASSWORD_RESET_OTPS_COLLECTION.create_index("created_at", expireAfterSeconds=30*86400)
        except Exception as idx_err:
            print(f"[OTP Scheduler] Note on TTL index: {idx_err}")

        worker = threading.Thread(target=_run_scheduler, daemon=True, name="OtpCleanupWorker")
        worker.start()
        print("[OTP Scheduler] Started daily OTP cleanup worker (runs every 24 hours for OTPs > 30 days).")
    except Exception as e:
        print(f"[OTP Scheduler] Failed to initialize scheduler: {e}")
