@echo off
setlocal

set BASEDIR=%~dp0
set BASEDIR=%BASEDIR:~0,-1%
set MAVEN_PROJECTBASEDIR=%BASEDIR%
set MAVEN_WRAPPER_PROPERTIES=%BASEDIR%\.mvn\wrapper\maven-wrapper.properties

if exist "%MAVEN_WRAPPER_PROPERTIES%" (
  for /f "usebackq tokens=1,* delims==" %%a in ("%MAVEN_WRAPPER_PROPERTIES%") do (
    if "%%a"=="distributionUrl" set MAVEN_DISTRIBUTION_URL=%%b
    if "%%a"=="wrapperUrl" set MAVEN_WRAPPER_URL=%%b
  )
)

if not defined MAVEN_WRAPPER_URL set MAVEN_WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

set WRAPPER_JAR=%BASEDIR%\.mvn\wrapper\maven-wrapper.jar

if not exist "%WRAPPER_JAR%" (
  echo Downloading Maven Wrapper from %MAVEN_WRAPPER_URL%
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri '%MAVEN_WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
  if errorlevel 1 (
    echo Failed to download Maven Wrapper.
    exit /b 1
  )
)

set JAVA_EXE=java
if defined JAVA_HOME set JAVA_EXE=%JAVA_HOME%\bin\java

pushd "%BASEDIR%"
"%JAVA_EXE%" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
popd

endlocal
