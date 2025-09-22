import json

from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.dateparse import parse_datetime
from wagtail.models import Page

from .forms import ScheduleForm


def calendar_view(request):
    """
    Renders the main calendar view and form for the modal.
    """
    form = ScheduleForm()
    context = {"form": form, "page_title": "Page Scheduler"}
    return render(request, "wagtail_publish_calendar/calendar.html", context)


def get_page_schedual_dates(request):
    """
    Creates event data with descriptive titles and color codes.
    """
    pages = Page.objects.filter(Q(go_live_at__isnull=False) | Q(expire_at__isnull=False))
    events = []

    for page in pages:
        if page.go_live_at:
            events.append(
                {
                    "id": f"{page.id}-start",
                    "title": f"{page.title} (Go-live)",  # <-- COMBINED TITLE
                    "start": page.go_live_at.isoformat(),
                    "color": "#008352",
                    "extendedProps": {"type": "start"},
                }
            )
        if page.expire_at:
            events.append(
                {
                    "id": f"{page.id}-end",
                    "title": f"{page.title} (Expire)",  # <-- COMBINED TITLE
                    "start": page.expire_at.isoformat(),
                    "color": "#cd4444",
                    "extendedProps": {"type": "end"},
                }
            )

    return JsonResponse(events, safe=False)


def update_page_schedual_date(request):
    """
    Updates both go-live and expiry dates for a given page ID in a single
    request.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        page_id = data.get("page_id")

        # A null or empty string from the frontend means the date should be cleared
        go_live_str = data.get("go_live_at")
        expire_str = data.get("expire_at")

        page = Page.objects.get(id=page_id)

        page.go_live_at = parse_datetime(go_live_str) if go_live_str else None
        page.expire_at = parse_datetime(expire_str) if expire_str else None

        print(page)

        page.save()
        return JsonResponse({"status": "ok", "message": f"Schedule for '{page.title}' updated."})

    except Page.DoesNotExist:
        return JsonResponse({"error": "Page not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
