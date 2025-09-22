from django.urls import include, path, reverse
from wagtail import hooks
from wagtail.admin.menu import MenuItem

# No need for a separate views import if you use the app's urls
from . import urls as calendar_urls


@hooks.register("register_admin_urls")
def register_admin_urls():
    # Single hook to include all your app's URLs under a namespace
    return [
        path("publish-calendar/", include(calendar_urls, namespace="wagtail_publish_calendar")),
    ]


@hooks.register("register_admin_menu_item")
def register_calendar_menu_item():
    # This reverse now correctly uses the namespace from the URL registration
    return MenuItem("Pages Schedular", reverse("wagtail_publish_calendar:calendar"), icon_name="date")
