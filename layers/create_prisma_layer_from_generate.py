import shutil
import os
import fileinput
import sys
from os.path import exists
import glob
import inspect
import os.path


def replaceBinaryTargetForAWSInPrismaSchema(filepath):

    try:
        with fileinput.FileInput(filepath, inplace=True, backup='.bak') as file:
            for line in file:
                if "binaryTargets" in line:
                    print("  binaryTargets = [\"rhel-openssl-1.0.x\"]")
                else:
                    print(line, end="")
        return True
    except Exception as e:
        print("Error during replacing binaryTarget in file. Mission failed we'll get em next time")
        print("Exception e:{}".format(e))
        return False


def removeDirectoryOrDie(dirpath):
    try:
        shutil.rmtree(dirpath)
        return True
    except Exception as e:
        print("[removeDirectorySafe] error in deleting {} e:{}".format(dirpath, e))
        sys.exit()


def removeFileOrDie(dirpath):
    try:
        os.remove(dirpath)
        return True
    except Exception as e:
        print("[removeFileSafe] error in deleting {} e:{}".format(dirpath, e))
        sys.exit()


def removeFilesFromPatternOrDie(path_pattern):
    fileList = glob.glob(path_pattern)
    for filePath in fileList:
        try:
            os.remove(filePath)
        except:
            print("[removeFilesFromPattern] Error while deleting file : ", filePath)
            sys.exit()


absPathCentralPrismaFolder = "D:\\tutorials\\cdk-aws_lambda-prisma_layer\\prisma"
absPathPrismaLayer = "D:\\tutorials\\cdk-aws_lambda-prisma_layer\\layers\\tutorial_prisma_layer\\nodejs"

args = sys.argv
if len(args) < 2:
    print("Usage: python createzip_via_generate_rhe_layer_prisma.py .env.name")
    print("example: python createzip_via_generate_rhe_layer_prisma.py .env.develop")
    sys.exit()

dotenvfilename = args[1]
dotFullPath = absPathCentralPrismaFolder+"/../"+dotenvfilename
if exists(dotFullPath) is False:
    print("Cant find .env file at:{}".format(dotFullPath))
    sys.exit()

filenamePython = inspect.getframeinfo(inspect.currentframe()).filename
pythonPath = os.path.dirname(os.path.abspath(filenamePython))


print("Using Python path:"+pythonPath)

print("Using dot env file:"+dotenvfilename)


print("Copying {} as .env".format(dotenvfilename))

# (NOTE1) to be honest... in this case if you use prisma migrate from the "root" installation of prisma, doesnt even makes sense to use env here
# I decided to keep it for the sake of same way to format and generate prisma, but Im pretty sure if your not using migrate from "here"
# this can be avoided, let me know.
shutil.copy2(dotFullPath, absPathPrismaLayer+"/.env")


print("Copying prisma.schema ...")
shutil.copy2(absPathCentralPrismaFolder+'/schema.prisma', absPathPrismaLayer)

absPathCentralPrismaFolder = None  # just to be safe....

print("Replacing bynaryTarget ...")
if replaceBinaryTargetForAWSInPrismaSchema(absPathPrismaLayer+'/schema.prisma') is False:
    print(":(")
    sys.exit()

print("Deleting node_modules ...")
removeDirectoryOrDie(absPathPrismaLayer+"/node_modules")


print("Deleting yarn.lock")
try:
    os.remove(absPathPrismaLayer+"/yarn.lock")
except Exception as e:
    print("error in deleting yarn.lock e:{}".format(e))

print("Deleting package-lock.json")
try:
    os.remove(absPathPrismaLayer+"/package-lock.json")
except Exception as e:
    print("error in deleting package-lock.json e:{}".format(e))

print("Changing directory to {}".format(absPathPrismaLayer))
os.chdir(absPathPrismaLayer)

print("installing dependencies")
os.system("npm install")

print("formatting prisma schema")

# see (Note 1) about dotenv stuffs....
os.system("npx dotenv -e .env -- npx prisma format --schema ./schema.prisma")
print("generating prisma client..")
os.system("npx dotenv -e .env -- npx prisma generate --schema ./schema.prisma")

# .bak is used just to be safe in case something fuck up during replacing binaryTarget. just another "defensive approach" thing.
print("Deleting schema.prisma.bak")
try:
    os.remove("schema.prisma.bak")
except Exception as e:
    print("error in deleting schema.prisma.bak e:{}".format(e))


removeDirectoryOrDie(absPathPrismaLayer+"/node_modules/@prisma/engines")
removeDirectoryOrDie(absPathPrismaLayer+"/node_modules/.bin")
removeDirectoryOrDie(absPathPrismaLayer+"/node_modules/.cache")
removeFilesFromPatternOrDie(
    absPathPrismaLayer+"/node_modules/.prisma/client/query_engine*")
removeDirectoryOrDie(absPathPrismaLayer+"/node_modules/prisma")

print("Node_modules cleaned. Just CD to parent directory")
os.chdir(pythonPath)
print("Deleting old tutorial_prisma_layer.zip")
try:
    os.remove(pythonPath+"/tutorial_prisma_layer.zip")
except Exception as e:
    print("error in deleting tutorial_prisma_layer.zip e:{}".format(e))

# create a ZipFile object
shutil.make_archive("tutorial_prisma_layer", 'zip',
                    pythonPath+"/tutorial_prisma_layer/")
print("ALL DONE ZIP PRISMA LAMBDA LAYER CREATED !!!!!!")
