from webapp.config import IS_DEVELOPMENT
from webapp.vite_integration.impl import (
    DevViteIntegration,
    ProdViteIntegration,
)


ViteIntegration = (DevViteIntegration if IS_DEVELOPMENT else ProdViteIntegration)()
