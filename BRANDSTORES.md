# Brand stores

To create a brand store, create a file with the name of the store in the folder `webapp/configs`. Then run the project with the environment variable WEBAPP set with the name of the store.

## Example

Let's create the brand store storePlus. First create the file `webapp/configs/storePlus.py`

```python
# webapp/configs/storePlus.py

WEBAPP_CONFIG = {
    'LAYOUT': '_layout-brandstore.html', # custom layout for brandstores
    'STORE_NAME': 'Store Plus',         # Store name displayed in the header
    'STORE_QUERY': 'storePlus',              # Store to query to the snap store
}
```

Then run the project with this command, make sure the WEBAPP has the same name as the brand config file:

```bash
./run --env WEBAPP=storePlus
```
