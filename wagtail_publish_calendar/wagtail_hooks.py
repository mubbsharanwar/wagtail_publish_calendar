from wagtail import hooks
from wagtail.admin.menu import MenuItem
from django.urls import path, reverse
from django.urls import path, include
from . import views


@hooks.register("register_admin_urls")
def register_admin_urls():
    return [
        path("publish-calendar/", include("wagtail_publish_calendar.urls")),
    ]

@hooks.register("register_admin_urls")
def register_calendar_url():
    return [
        path("publish-calendar/", views.calendar_view, name="wagtail_publish_calendar"),
    ]


@hooks.register("register_admin_menu_item")
def register_calendar_menu_item():
    return MenuItem("Pages Schedular", reverse("wagtail_publish_calendar"), icon_name="date")
