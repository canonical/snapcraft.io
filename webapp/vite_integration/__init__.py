import os

from webapp.vite_integration.impl import (
    DevViteIntegration,
    ProdViteIntegration,
)


IS_PROD = os.getenv("ENVIRONMENT", "devel") != "devel"


ViteIntegration = (ProdViteIntegration if IS_PROD else DevViteIntegration)()
