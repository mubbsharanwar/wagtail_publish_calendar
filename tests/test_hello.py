import unittest


def hello_function():
    return "Hello, World!"


class TestHelloPlugin(unittest.TestCase):
    def test_hello_function(self):
        self.assertEqual(hello_function(), "Hello, World!")


if __name__ == "__main__":
    unittest.main()
