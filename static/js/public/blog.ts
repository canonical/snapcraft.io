import declareGlobal from "../libs/declare";
import { newsletter } from "./newsletter";

declareGlobal("snapcraft.public.blog", { newsletter });
