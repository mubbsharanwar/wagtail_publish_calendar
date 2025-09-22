import pytest  # noqa F401

from wagtail_publish_calendar import wagtail_hooks


def test_register_admin_urls_hook():
    urls = wagtail_hooks.register_admin_urls()
    assert isinstance(urls, list)
    assert any("publish-calendar" in str(u) for u in urls)


def test_register_calendar_menu_item_hook():
    menu_item = wagtail_hooks.register_calendar_menu_item()
    assert hasattr(menu_item, "name") or hasattr(menu_item, "label")
    assert "Schedular" in menu_item.label
