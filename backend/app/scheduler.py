from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
import atexit

from .services.ladder_service import scheduled_ladder_update
from .services.fixtures_service import scheduled_fixtures_update

logger = logging.getLogger(__name__)

class TaskScheduler:
    """Background task scheduler for recurring jobs"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        
        # Register cleanup on app shutdown
        atexit.register(lambda: self.scheduler.shutdown())
        
        logger.info("Task scheduler initialized")
    
    def setup_scheduled_tasks(self):
        """Setup all scheduled tasks"""
        
        # Schedule ladder update every Thursday at 6:00 AM
        self.scheduler.add_job(
            func=scheduled_ladder_update,
            trigger=CronTrigger(
                day_of_week='thu',  # Thursday
                hour=6,            # 6 AM
                minute=0,          # 0 minutes
                timezone='Australia/Melbourne'  # Adjust timezone as needed
            ),
            id='ladder_update',
            name='Weekly Ladder Update',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )
        
        # Schedule fixtures update every Thursday at 6:05 AM (5 minutes after ladder)
        self.scheduler.add_job(
            func=scheduled_fixtures_update,
            trigger=CronTrigger(
                day_of_week='thu',  # Thursday
                hour=6,            # 6 AM
                minute=5,          # 5 minutes (after ladder update)
                timezone='Australia/Melbourne'  # Adjust timezone as needed
            ),
            id='fixtures_update',
            name='Weekly Fixtures Update',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )
        
        logger.info("Scheduled tasks setup completed")
        logger.info("- Ladder update: Every Thursday at 6:00 AM (Melbourne time)")
        logger.info("- Fixtures update: Every Thursday at 6:05 AM (Melbourne time)")
    
    def trigger_ladder_update_now(self):
        """Manually trigger ladder update (for testing/admin)"""
        try:
            logger.info("Manually triggering ladder update")
            result = scheduled_ladder_update()
            return result
        except Exception as e:
            logger.error(f"Error in manual ladder update: {e}")
            return False
    
    def trigger_fixtures_update_now(self):
        """Manually trigger fixtures update (for testing/admin)"""
        try:
            logger.info("Manually triggering fixtures update")
            result = scheduled_fixtures_update()
            return result
        except Exception as e:
            logger.error(f"Error in manual fixtures update: {e}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def get_scheduled_jobs(self):
        """Get list of all scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                'trigger': str(job.trigger)
            })
        return jobs
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Task scheduler shut down")

# Global scheduler instance
task_scheduler = None

def get_scheduler() -> TaskScheduler:
    """Get the global scheduler instance"""
    global task_scheduler
    if task_scheduler is None:
        task_scheduler = TaskScheduler()
        task_scheduler.setup_scheduled_tasks()
    return task_scheduler