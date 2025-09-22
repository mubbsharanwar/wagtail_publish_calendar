from django.urls import path

from . import views

app_name = "wagtail_publish_calendar"

urlpatterns = [
    path("", views.calendar_view, name="calendar"),
    path("events/", views.get_page_schedual_dates, name="events_json"),
    path("update/", views.update_page_schedual_date, name="update_event"),
]
