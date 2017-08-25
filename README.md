# snapcraft.io

This is the new [Flask](http://flask.pocoo.org/) application that will gradually replace the website at https://snapcraft.io, starting with the snap details page.

## Local development

To run the site for local development, follow these steps:

### Installing dependencies

``` bash
python3 -m venv env3             # Create a python3 virtual environment
source env3/bin/activate         # Use the python3 environment
pip install -r requirements.txt  # Install python dependencies
yarn install                     # Install NPM dependencies into node_modules
```

### Building CSS

``` bash
yarn run build  # Build SCSS files into CSS
```

### Run the site

To run the local webserver at http://127.0.0.1:5000 :

``` bash
FLASK_APP=app.py FLASK_DEBUG=true flask run
```

### Testing

First make sure the site's dependencies are installed. Then:

``` bash
pip install flake8  # Install flake8 for syntax testing
flake8 app.py       # Check the python application syntax
python3 tests.py    # Run the python tests
yarn run test       # Test the Sass syntax
```

