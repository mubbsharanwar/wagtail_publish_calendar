from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory

from wagtail_publish_calendar import views


@pytest.mark.django_db
def test_calendar_view_renders_template():
    factory = RequestFactory()
    request = factory.get("/admin/publish-calendar/")
    User = get_user_model()
    request.user = User.objects.create_user(username="testuser", password="testpass")
    response = views.calendar_view(request)
    assert response.status_code == 200
    assert "Page Scheduler" in response.content.decode()


@pytest.mark.django_db
@mock.patch("wagtail_publish_calendar.views.Page")
def test_get_page_schedual_dates(mock_page):
    factory = RequestFactory()
    request = factory.get("/admin/publish-calendar/get-page-schedual-dates/")
    # Setup mock pages
    page1 = mock.Mock()
    page1.id = 1
    page1.title = "Test Page"
    page1.go_live_at = mock.Mock()
    page1.go_live_at.isoformat.return_value = "2025-09-22T10:00:00"
    page1.expire_at = None
    mock_page.objects.filter.return_value = [page1]
    response = views.get_page_schedual_dates(request)
    assert response.status_code == 200
    import json

    data = json.loads(response.content)
    assert isinstance(data, list)
    assert data[0]["title"] == "Test Page (Go-live)"


@pytest.mark.django_db
@mock.patch("wagtail_publish_calendar.views.Page")
def test_update_page_schedual_date_success(mock_page):
    factory = RequestFactory()
    request = factory.post(
        "/admin/publish-calendar/update-page-schedual-date/",
        content_type="application/json",
        data=b'{"page_id": 1, "go_live_at": "2025-09-22T10:00:00", "expire_at": "2025-09-23T10:00:00"}',
    )
    page = mock.Mock()
    page.title = "Test Page"
    mock_page.objects.get.return_value = page
    response = views.update_page_schedual_date(request)
    import json

    assert response.status_code == 200
    data = json.loads(response.content)
    assert data["status"] == "ok"


@pytest.mark.django_db
def test_update_page_schedual_date_invalid_method():
    factory = RequestFactory()
    request = factory.get("/admin/publish-calendar/update-page-schedual-date/")
    response = views.update_page_schedual_date(request)
    assert response.status_code == 405
