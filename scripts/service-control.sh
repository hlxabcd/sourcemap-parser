#!/bin/bash

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 打印用法信息
print_usage() {
    cat <<EOF
Usage: $0 {start|stop|restart|status}

Commands:
  start      Start the services
  stop       Stop the services
  restart    Restart the services
  status     Show the status of the services
EOF
    exit 1
}

# 启动服务的函数
start_services() {
    cd "$PROJECT_ROOT"
    docker-compose up -d --build
    if [ $? -eq 0 ]; then
        echo "Services have been started successfully."
    else
        echo "Failed to start services. Please check the logs for more information."
        exit 1
    fi
}

# 停止服务的函数
stop_services() {
    cd "$PROJECT_ROOT"
    docker-compose down
    if [ $? -eq 0 ]; then
        echo "Services have been stopped and resources cleaned up."
    else
        echo "Failed to stop services. Please check the logs for more information."
        exit 1
    fi
}

# 重启服务的函数
restart_services() {
    stop_services
    start_services
}

# 查询服务状态的函数
status_services() {
    cd "$PROJECT_ROOT"
    docker-compose ps
}

# 检查参数数量
if [ $# -ne 1 ]; then
    print_usage
fi

# 根据参数执行相应的函数
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        status_services
        ;;
    *)
        print_usage
        ;;
esac