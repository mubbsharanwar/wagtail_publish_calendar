from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

urlpatterns = [
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # Include your app's custom URLs via hooks
    path("admin/publish-calendar/", include("wagtail_publish_calendar.urls")),
    # Optionally include the default Wagtail URLs
    path("", include(wagtail_urls)),
]
