from django.utils import timezone

from wagtail_publish_calendar.forms import ScheduleForm


def test_schedule_form_fields():
    form = ScheduleForm()
    assert "go_live_at" in form.fields
    assert "expiry_at" in form.fields


def test_schedule_form_valid_data():
    now = timezone.now()
    form = ScheduleForm(
        data={
            "go_live_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "expiry_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )
    assert form.is_valid()


def test_schedule_form_empty_data():
    form = ScheduleForm(data={})
    assert form.is_valid()


def test_schedule_form_invalid_data():
    form = ScheduleForm(data={"go_live_at": "not-a-date"})
    assert not form.is_valid()
