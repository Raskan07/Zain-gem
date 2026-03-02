$fonts = @(
    @{
        name = "Roboto-Regular.ttf"
        url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf"
    },
    @{
        name = "Roboto-Bold.ttf"
        url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf"
    },
    @{
        name = "Roboto-Medium.ttf"
        url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Medium.ttf"
    }
)

# Create fonts directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "public/fonts"

foreach ($font in $fonts) {
    Write-Host "Downloading $($font.name)..."
    Invoke-WebRequest -Uri $font.url -OutFile "public/fonts/$($font.name)"
}