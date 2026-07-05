import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`DTM-DMS backend listening on port ${env.port}`);
});
