from typing import TypedDict, List, Dict, Optional, Literal


class Config(TypedDict):
    mode: Literal["development", "production"]
    port: int
    outdir: str


class ManifestChunk(TypedDict):
    """
    Python equivalent of  Vite's 'ManifestChunk' type.
    """

    src: Optional[str]
    file: str
    css: Optional[List[str]]
    assets: Optional[List[str]]
    isEntry: Optional[bool]
    name: Optional[str]
    names: Optional[List[str]]
    isDynamicEntry: Optional[bool]
    imports: Optional[List[str]]
    dynamicImports: Optional[List[str]]


# Python equivalent of Vite's 'Manifest' type.
Manifest = Dict[str, ManifestChunk]
