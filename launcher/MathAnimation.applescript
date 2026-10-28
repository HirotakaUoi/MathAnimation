on run
    try
        set appPath to POSIX path of (path to me)
        set projectPath to do shell script "/usr/bin/dirname " & quoted form of appPath
        if not my isProjectFolder(projectPath) then
            try
                set projectPath to do shell script "/usr/bin/defaults read jp.mathanimation.launcher ProjectPath"
            on error
                set projectPath to ""
            end try
        end if
        if not my isProjectFolder(projectPath) then
            set projectPath to POSIX path of (choose folder with prompt "MathAnimationのフォルダ（index.htmlとlauncherがある場所）を選んでください。")
            if not my isProjectFolder(projectPath) then
                error "選択したフォルダにindex.htmlとlauncher/launch.pyが見つかりません。"
            end if
        end if
        do shell script "/usr/bin/defaults write jp.mathanimation.launcher ProjectPath -string " & quoted form of projectPath
        set launcherPath to projectPath & "/launcher/launch.py"
        do shell script "cd " & quoted form of projectPath & " && /usr/bin/env python3 " & quoted form of launcherPath
    on error errorMessage number errorNumber
        if errorNumber is not -128 then
            display alert "MathAnimationを開けませんでした" message (errorMessage & return & "Python 3が利用できることを確認してください。") as critical
        end if
    end try
end run

on isProjectFolder(folderPath)
    if folderPath is "" then return false
    try
        do shell script "/bin/test -f " & quoted form of (folderPath & "/index.html") & " && /bin/test -f " & quoted form of (folderPath & "/launcher/launch.py")
        return true
    on error
        return false
    end try
end isProjectFolder
