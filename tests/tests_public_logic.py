import unittest
import modules.public.logic as logic


class PublicLogicTest(unittest.TestCase):

    # convert_channel_maps
    # ===
    def test_empty_channel_map(self):
        channel_maps_list = []
        result = logic.convert_channel_maps(channel_maps_list)

        self.assertEqual(result, {})

    def test_one_track_channel_map(self):
        channel_maps_list = [
            {
                'architecture': 'arch',
                'map': [{'info': 'release'}],
                'track': 'track'
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [{'info': 'release'}]
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_same_arch_channel_map(self):
        channel_maps_list = [
            {
                'architecture': 'arch',
                'map': [{'info': 'release'}],
                'track': 'track'
            },
            {
                'architecture': 'arch',
                'map': [{'info': 'release'}],
                'track': 'track1'
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [{'info': 'release'}],
                'track1': [{'info': 'release'}]
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_different_arch_channel_map(self):
        channel_maps_list = [
            {
                'architecture': 'arch',
                'map': [{'info': 'release'}],
                'track': 'track'
            },
            {
                'architecture': 'arch1',
                'map': [{'info': 'release'}],
                'track': 'track'
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [{'info': 'release'}],
            },
            'arch1': {
                'track': [{'info': 'release'}],
            }
        }

        self.assertEqual(result, expected_result)
