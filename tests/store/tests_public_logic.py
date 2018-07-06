import unittest
import webapp.store.logic as logic


class StoreLogicTest(unittest.TestCase):

    # convert_channel_maps
    # ===
    def test_empty_channel_map(self):
        channel_maps_list = []
        result = logic.convert_channel_maps(channel_maps_list)

        self.assertEqual(result, {})

    def test_one_track_channel_map(self):
        channel_maps_list = [
            {
                'channel': {
                    'name': 'channel',
                    'architecture': 'arch',
                    'track': 'track',
                    'risk': 'risk'
                },
                'created-at': 'date',
                'confinement': 'confinement',
                'download': {
                    'size': 'size'
                },
                'version': 'version'
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [
                    {
                        'channel': 'channel',
                        'created-at': 'date',
                        'confinement': 'confinement',
                        'size': 'size',
                        'risk': 'risk',
                        'version': 'version'
                    }
                ]
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_same_arch_channel_map(self):
        channel_maps_list = [
            {
                'channel': {
                    'name': 'channel',
                    'architecture': 'arch',
                    'track': 'track',
                    'risk': 'risk'
                },
                'created-at': 'date',
                'confinement': 'confinement',
                'download': {
                    'size': 'size'
                },
                'version': 'version'
            },
            {
                'channel': {
                    'name': 'channel',
                    'architecture': 'arch',
                    'track': 'track1',
                    'risk': 'risk'
                },
                'created-at': 'date',
                'confinement': 'confinement',
                'download': {
                    'size': 'size'
                },
                'version': 'version'
            }
        ]
        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [
                    {
                        'channel': 'channel',
                        'created-at': 'date',
                        'confinement': 'confinement',
                        'size': 'size',
                        'risk': 'risk',
                        'version': 'version'
                    }
                ],
                'track1': [
                    {
                        'channel': 'channel',
                        'created-at': 'date',
                        'confinement': 'confinement',
                        'size': 'size',
                        'risk': 'risk',
                        'version': 'version'
                    }
                ]
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_different_arch_channel_map(self):
        channel_maps_list = [
            {
                'channel': {
                    'name': 'channel',
                    'architecture': 'arch',
                    'track': 'track',
                    'risk': 'risk'
                },
                'created-at': 'date',
                'confinement': 'confinement',
                'download': {
                    'size': 'size'
                },
                'version': 'version'
            },
            {
                'channel': {
                    'name': 'channel',
                    'architecture': 'arch1',
                    'track': 'track',
                    'risk': 'risk'
                },
                'created-at': 'date',
                'confinement': 'confinement',
                'download': {
                    'size': 'size'
                },
                'version': 'version'
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            'arch': {
                'track': [
                    {
                        'channel': 'channel',
                        'created-at': 'date',
                        'confinement': 'confinement',
                        'size': 'size',
                        'risk': 'risk',
                        'version': 'version'
                    }
                ]
            },
            'arch1': {
                'track': [
                    {
                        'channel': 'channel',
                        'created-at': 'date',
                        'confinement': 'confinement',
                        'size': 'size',
                        'risk': 'risk',
                        'version': 'version'
                    }
                ]
            }
        }

        self.assertEqual(result, expected_result)
