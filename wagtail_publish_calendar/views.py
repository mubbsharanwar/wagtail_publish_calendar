import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
from wagtail.models import Page

from wagtail_publish_calendar.forms import ScheduleForm


def calendar_view(request):
    form = ScheduleForm()
    return render(request, "wagtail_publish_calendar/calendar.html", {"form": form})

def get_page_schedual_dates(request):
    events = []
    for page in Page.objects.filter(go_live_at__isnull=False):
        events.append({
            "id": f"{page.id}-start",
            "title": f"{page.title} (Go live)",
            "start": page.go_live_at.isoformat(),
            "type": "start",
        })

        if page.expire_at:
            events.append({
                "id": f"{page.id}-end",
                "title": f"{page.title} (Expires)",
                "start": page.expire_at.isoformat(),
                "type": "end",
            })

    return JsonResponse(events, safe=False)

@csrf_exempt
def update_page_schedual_date(request):
    data = json.loads(request.body)
    page = Page.objects.get(id=data.get("id"))
    iso_str = data.get("new_date")
    field_type = data.get("type")

    parsed_date = parse_datetime(iso_str)

    if field_type == "start":
        page.go_live_at = parsed_date
    elif field_type == "end":
        page.expire_at = parsed_date
    else:
        return JsonResponse({"message": "Invalid type"}, status=400)

    page.save()
    return JsonResponse({"status": "ok"})