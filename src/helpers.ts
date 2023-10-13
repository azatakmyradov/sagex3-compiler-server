export const escapeShell = (arg: string) => {
    // convert slashes to windows format
    return arg = arg.replace(/\//g, '\\');
}
