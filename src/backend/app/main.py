import json
import os
import signal
import sys

import shared


def main():
    # load config file and init globals
    app_config_path = sys.argv[1] if len(sys.argv) > 1 else "./app_config.prod.yml"
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
