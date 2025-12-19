# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  channel = "stable-24.11";

  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.zulu
    pkgs.flutter
    pkgs.python311
    pkgs.python311Packages.pip
  ];

  env = {
    # NEW CORRECTION: Revert to a string, but prepend the paths using $PATH
    # This assumes the custom environment runner expects a shell variable-style string.
    PATH = "/home/user/.global_modules/bin:$PATH";
  };

  idx = {
    extensions = [
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];

    workspace = {
      onCreate = {
        install-deps = "npm install";
      };
      onStart = {
        run-dev = "echo 'Workspace started'";
      };
    };
  };
}