import os


class Config:
    DEBUG = os.getenv('FLASK_DEBUG', '1') == '1'
    JSON_SORT_KEYS = False

    @staticmethod
    def as_dict():
        return {
            'DEBUG': Config.DEBUG,
            'JSON_SORT_KEYS': Config.JSON_SORT_KEYS,
        }


def get_config():
    return Config
