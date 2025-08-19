import declareGlobal from "../libs/declare";
import { snapDetailsPosts } from "./snap-details/blog-posts";

declareGlobal("snapcraft.public.publisherDetails", { snapDetailsPosts });
