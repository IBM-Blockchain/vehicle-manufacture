#!/bin/bash

get_full_path() {
    BASEDIR=${1}

    if [ $BASEDIR = '.' ]
    then
        echo $(pwd)
    elif [ ${BASEDIR:0:2} = './' ]
    then
        echo $(pwd)${BASEDIR:1}
    elif [ ${BASEDIR:0:1} = '/' ]
    then
        echo ${BASEDIR}
    else
        echo $(pwd)/${BASEDIR}
    fi
}

wait_until() {
    COMMAND=${1}
    MAX_COUNT=${2}
    SLEEP=${3}

    WAIT=true
    COUNT=0

    echo "Running command $COMMAND"

    while [[ "$COUNT" -lt "$MAX_COUNT" && "$WAIT" = true ]]; do
        set +e
        eval "$COMMAND"
        EXIT=$?
        set -e

        COUNT=$((COUNT+1))

        if [ "$EXIT" -eq 0 ]; then
            WAIT=false
        elif [ "$COUNT" -eq "$MAX_COUNT" ] ; then
            echo "Command $COMMAND was attempted $MAX_COUNT times and failed"
            exit 1
        else
            sleep $SLEEP
        fi
    done

    echo "Command succeeded"
}

set_docker_env() {
    ENV_DIRS=${1}

    for ENV_DIR in "$@"; do
        export $(cat $ENV_DIR/.env | xargs)
    done
}

sed_inplace() {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@" # -- fails on mac so we can work out which sed to run
}
