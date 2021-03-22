import json
import os
import signal
import sys

import shared


def main():
    # load config file and init globals
    if len(sys.argv) > 1:
        app_config_path = sys.argv[1]
    elif os.getenv("ENV", "DEV") == "PROD":
        app_config_path = "./app_config.yml"
    else:
        app_config_path = "./config/app_config.yml"
    shared.init(config_file=app_config_path)

    logger = shared.get_logger("main")
    logger.info(f"config loaded: \n{json.dumps(shared.config, indent=2)}")  # TODO remove sensitive fields

    signal.signal(signal.SIGTERM, lambda s, f: os.kill(os.getpid(), signal.SIGINT))

    import server
    try:
        server.run()
    except KeyboardInterrupt:
        logger.warning("SIGINT received, exit")
        server.stop()
        sys.exit(0)


if __name__ == "__main__":
    main()
