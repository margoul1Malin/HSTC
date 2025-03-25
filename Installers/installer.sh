# Initializing Colors
RESET='\033[0m'             
BOLD='\033[1m'              
UNDERLINE='\033[4m'         
BLINK='\033[5m'             

# Base Colors
BLACK='\033[30m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
MAGENTA='\033[35m'
CYAN='\033[36m'
WHITE='\033[37m'

# Bold Colors
BOLD_BLACK='\033[1;30m'
BOLD_RED='\033[1;31m'
BOLD_GREEN='\033[1;32m'
BOLD_YELLOW='\033[1;33m'
BOLD_BLUE='\033[1;34m'
BOLD_MAGENTA='\033[1;35m'
BOLD_CYAN='\033[1;36m'
BOLD_WHITE='\033[1;37m'

# Background Colors
BG_BLACK='\033[40m'
BG_RED='\033[41m'
BG_GREEN='\033[42m'
BG_YELLOW='\033[43m'
BG_BLUE='\033[44m'
BG_MAGENTA='\033[45m'
BG_CYAN='\033[46m'
BG_WHITE='\033[47m'

echo -e "${BOLD_GREEN}Updating System...${RESET}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "${BOLD_BLUE}Installing Dependencies...${RESET}"

# Install Nmap
function install_nmap() {
    if [ $(which nmap) ]; then
        echo -e "${BOLD_GREEN}Nmap is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Nmap...${RESET}"
    sudo apt-get install nmap
    echo -e "${BOLD_GREEN}Nmap has been successfully installed${RESET}"
}

function install_gobuster() {
    if [ $(which gobuster) ]; then
        echo -e "${BOLD_GREEN}Gobuster is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Gobuster...${RESET}"
    sudo apt-get install gobuster
    echo -e "${BOLD_GREEN}Gobuster has been successfully installed${RESET}"

function install_hydra() {
    if [ $(which hydra) ]; then 
        echo -e "${BOLD_GREEN}Hydra is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Hydra...${RESET}"
    sudo apt-get install hydra
    echo -e "${BOLD_GREEN}Hydra has been successfully installed${RESET}"

function install_john() {
    if [ $(which john) ]; then
        echo -e "${BOLD_GREEN}John is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing John...${RESET}"
    sudo apt-get install john
    echo -e "${BOLD_GREEN}John has been successfully installed${RESET}"
}

## Needs to fix some bugs in xsser
function install_xsser() {
    if [ $(which xsser) ]; then
        echo -e "${BOLD_GREEN}Xsser is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Xsser...${RESET}"
    sudo apt-get install xsser
    echo -e "${BOLD_GREEN}Xsser has been successfully installed${RESET}"
}

function install_metasploit() {
    if [ $(which msfvenom) ]; then
        echo -e "${BOLD_GREEN}Metasploit is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Metasploit...${RESET}"
    sudo apt-get install metasploit-framework
    echo -e "${BOLD_GREEN}Metasploit has been successfully installed${RESET}"
}

function install_exiftool() {
    if [ $(which exiftool) ]; then
        echo -e "${BOLD_GREEN}Exiftool is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Exiftool...${RESET}"
    sudo apt-get install exiftool
    echo -e "${BOLD_GREEN}Exiftool has been successfully installed${RESET}"
}

function install_git() {
    if [ $(which git) ]; then
        echo -e "${BOLD_GREEN}Git is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Git...${RESET}"
    sudo apt-get install git
    echo -e "${BOLD_GREEN}Git has been successfully installed${RESET}"
}

function install_npm() {
    if [ $(which npm) ]; then
        echo -e "${BOLD_GREEN}NPM is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing NPM...${RESET}"
    sudo apt-get install npm
    echo -e "${BOLD_GREEN}NPM has been successfully installed${RESET}"
}

function install_xsser() {
    if [ $(which xsser) ]; then
        echo -e "${BOLD_GREEN}Xsser is installed${RESET}"
        return
    fi
    echo -e "${BOLD_BLUE}Installing Xsser...${RESET}"
    sudo apt-get install xsser
    echo -e "${BOLD_GREEN}Xsser has been successfully installed${RESET}"
}


echo -e "${BOLD_GREEN}External dependencies Successfully Installed${RESET}"

echo -e "${BOLD_BLUE}Installing Python Dependencies...${RESET}"

function install_python_deps() {
    
    echo -e "${BOLD_BLUE}Installing Python3-venv...${RESET}"
    sudo apt-get install python3-venv
    echo -e "${BOLD_GREEN}Python3-venv has been successfully installed${RESET}"
    
    echo -e "${BOLD_BLUE}Installing Python3-pip...${RESET}"
    sudo apt-get install python3-pip
    echo -e "${BOLD_GREEN}Python3-pip has been successfully installed${RESET}"
}

python3 -m venv ../env && source ../env/bin/activate

pip install -r requirements.txt

echo -e "${BOLD_GREEN}Python Dependencies Successfully Installed${RESET}"


    