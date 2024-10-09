"use client";

import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toPng } from 'html-to-image';
import Image from 'next/image';

const shapes = ["Circle", "Rectangle", "Oval", "Hexagon"];

export default function Home() {
  const [innerShadow, setInnerShadow] = useState(false);
  const [outerShadow, setOuterShadow] = useState(false);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(0);
  const [selectedShape, setSelectedShape] = useState("Circle");
  const [color, setColor] = useState("#000000");
  const [reverseColor, setReverseColor] = useState(false);
  const [size, setSize] = useState(200);
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [svgContent, setSvgContent] = useState('');
  const quadrantRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const [useTexture, setUseTexture] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [innerShadowColor, setInnerShadowColor] = useState("#000000");
  const [outerShadowColor, setOuterShadowColor] = useState("#000000");

  useEffect(() => {
    if (svgContent) {
      updateSvgColor(color);
    }
  }, [svgContent, color, size, rotation, tilt, strokeWidth]);

  const handleFileUpload = (file: File) => {
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgContent(content);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload an SVG file.");
    }
  };

  const getSvgStyle = () => {
    return {
      width: `${size}px`,
      height: `${size}px`,
      transform: `rotate(${rotation}deg) perspective(500px) rotateX(${tilt}deg)`,
      filter: `${getOuterShadowStyle()} ${reverseColor && !useTexture ? 'invert(1)' : ''} ${!useTexture && reverseColor ? '' : `brightness(0) saturate(100%) ${color !== '#000000' ? `invert(1) sepia(100%) saturate(10000%) hue-rotate(${getHueRotate(color)}deg)` : ''}`}`,
      opacity: useTexture ? 0.1 : 1, // Make icon more transparent when texture is used
    };
  };

  const getOuterShadowStyle = () => {
    if (!outerShadow) return '';
    
    const shadowColor = outerShadowColor + "E6"; // Add alpha channel for 90% opacity
    const blurRadius = Math.sqrt(shadowX * shadowX + shadowY * shadowY);
    return `drop-shadow(${shadowX}px ${shadowY}px ${blurRadius}px ${shadowColor})`;
  };

  const getInnerShadowFilter = () => {
    if (!innerShadow) return '';
    
    const shadowColor = innerShadowColor + "B3"; // Add alpha channel for 70% opacity
    const lightColor = "rgba(255,255,255,0.7)";
    const offset = Math.max(1, Math.sqrt(shadowX * shadowX + shadowY * shadowY) / 5);
    return `
      <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${offset / 2}" result="blur"/>
        <feOffset dx="${shadowX / 5}" dy="${shadowY / 5}" in="blur" result="offsetBlur"/>
        <feFlood flood-color="${shadowColor}" result="shadowColor"/>
        <feComposite in="shadowColor" in2="offsetBlur" operator="in" result="shadowInner"/>
        
        <feGaussianBlur in="SourceAlpha" stdDeviation="${offset / 2}" result="blur2"/>
        <feOffset dx="${-shadowX / 5}" dy="${-shadowY / 5}" in="blur2" result="offsetBlur2"/>
        <feFlood flood-color="${lightColor}" result="lightColor"/>
        <feComposite in="lightColor" in2="offsetBlur2" operator="in" result="lightInner"/>
        
        <feMerge>
          <feMergeNode in="shadowInner"/>
          <feMergeNode in="lightInner"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  };

  const getDepthEffect = () => {
    return `
      <filter id="depthEffect">
        <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="thicken" />
        <feGaussianBlur in="thicken" stdDeviation="3" result="blurred" />
        <feFlood flood-color="rgba(0,0,0,0.3)" result="glowColor" />
        <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow" />
        <feMerge>
          <feMergeNode in="softGlow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  };

  const containerStyle = {
    width: '250px',  // Set a fixed width
    height: '250px', // Set a fixed height
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Hide overflow if SVG becomes larger than container
  };

  const maskStyle = {
    clipPath: selectedShape === "Circle" ? "circle(50%)" :
              selectedShape === "Rectangle" ? "inset(0)" :
              selectedShape === "Oval" ? "ellipse(40% 50% at 50% 50%)" :
              selectedShape === "Hexagon" ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" : "",
  };

  const handleQuadrantClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (quadrantRef.current) {
      const rect = quadrantRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setShadowX(Math.round(x / 2));
      setShadowY(Math.round(y / 2));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDownload = async () => {
    if (svgRef.current) {
      try {
        const dataUrl = await toPng(svgRef.current, { quality: 0.95 });
        const link = document.createElement('a');
        link.download = 'svg-image.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error generating PNG:', err);
      }
    }
  };

  const getTextureStyle = () => {
    return {
      backgroundImage: `url('/images/texture.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      opacity: useTexture ? 1 : 0,
      transition: 'opacity 0.3s ease',
    };
  };

  const updateSvgColor = (newColor: string) => {
    if (svgRef.current) {
      const svgElement = svgRef.current.querySelector('svg');
      if (svgElement) {
        const paths = svgElement.querySelectorAll('path');
        paths.forEach(path => {
          path.setAttribute('stroke', newColor);
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-8">
        <Card className="w-fit">
          <CardContent className="p-4">
            {svgContent ? (
              <div style={containerStyle}>
                <div ref={svgRef as React.RefObject<HTMLDivElement>} style={{ ...maskStyle, position: 'relative' }}>
                  <div style={getTextureStyle()}></div>
                  <svg width={size} height={size}>
                    <defs dangerouslySetInnerHTML={{ __html: getInnerShadowFilter() + getDepthEffect() }} />
                    <g filter={`${innerShadow ? "url(#innerShadow)" : ""} ${useTexture ? "url(#depthEffect)" : ""}`}>
                      <foreignObject width="100%" height="100%">
                        <div dangerouslySetInnerHTML={{ 
                          __html: svgContent.replace(/<svg/, `<svg style="${Object.entries(getSvgStyle()).map(([key, value]) => `${key}:${value}`).join(';')}"`)
                            .replace(/<path/g, `<path stroke="${color}" stroke-width="${strokeWidth}"`)
                        }} />
                      </foreignObject>
                    </g>
                  </svg>
                </div>
              </div>
            ) : (
              <div
                ref={dropZoneRef}
                className={`flex flex-col items-center justify-center w-[300px] h-[300px] border-2 border-dashed rounded-lg transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SVG files only</p>
                <input
                  type="file"
                  accept=".svg"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                  Select SVG File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {svgContent && (
          <Button onClick={handleDownload} className="mt-4">
            Download as PNG
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Section 1: Shadows and Direction */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Shadows and Direction</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Inner Shadow <span className="text-xs text-yellow-600">(Work in Progress)</span></Label>
                <Switch checked={innerShadow} onCheckedChange={setInnerShadow} />
              </div>
              {innerShadow && (
                <div>
                  <Label className="mb-2 block">Inner Shadow Color</Label>
                  <Input 
                    type="color" 
                    value={innerShadowColor} 
                    onChange={(e) => setInnerShadowColor(e.target.value)} 
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Outer Shadow</Label>
                <Switch checked={outerShadow} onCheckedChange={setOuterShadow} />
              </div>
              {outerShadow && (
                <div>
                  <Label className="mb-2 block">Outer Shadow Color</Label>
                  <Input 
                    type="color" 
                    value={outerShadowColor} 
                    onChange={(e) => setOuterShadowColor(e.target.value)} 
                  />
                </div>
              )}
              <div>
                <Label className="mb-2 block">Shadow Direction and Intensity</Label>
                <div 
                  ref={quadrantRef}
                  className="w-full h-64 bg-gray-200 relative cursor-pointer overflow-hidden"
                  onClick={handleQuadrantClick}
                >
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/2 left-1/2 w-px h-full bg-gray-400 transform -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-full h-px bg-gray-400 transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div 
                      className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: `calc(50% + ${shadowX}px)`, 
                        top: `calc(50% + ${shadowY}px)`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">X: {shadowX}px, Y: {shadowY}px</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Size, Rotation, and Tilt */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Size, Rotation, and Tilt</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Size: {size}px</Label>
                <Slider
                  min={100}
                  max={400}
                  step={1}
                  value={[size]}
                  onValueChange={(value) => setSize(value[0])}
                />
              </div>
              <div>
                <Label className="mb-2 block">Rotation: {rotation}°</Label>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                />
              </div>
              <div>
                <Label className="mb-2 block">Tilt: {tilt}°</Label>
                <Slider
                  min={0}
                  max={90}
                  step={1}
                  value={[tilt]}
                  onValueChange={(value) => setTilt(value[0])}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Color */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Color</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Color</Label>
                <Input 
                  type="color" 
                  value={color} 
                  onChange={(e) => {
                    setColor(e.target.value);
                    updateSvgColor(e.target.value);
                  }} 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Reverse Color <span className="text-xs text-yellow-600">(Work in Progress)</span></Label>
                <Switch checked={reverseColor} onCheckedChange={setReverseColor} />
              </div>
              <div>
                <Label className="mb-2 block">Texture <span className="text-xs text-yellow-600">(Work in Progress)</span></Label>
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src="/images/texture.png"
                      alt="Texture"
                      width={64}
                      height={64}
                      objectFit="cover"
                    />
                  </div>
                  <Switch checked={useTexture} onCheckedChange={setUseTexture} />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Stroke Width: {strokeWidth}px</Label>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={[strokeWidth]}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Shape */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Shape</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Mask Shape <span className="text-xs text-yellow-600">(Work in Progress)</span></Label>
                <Select value={selectedShape} onValueChange={setSelectedShape}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((shape) => (
                      <SelectItem key={shape} value={shape}>
                        {shape}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getHueRotate(color: string) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const hsl = rgbToHsl(r, g, b);
  return hsl[0] !== undefined ? Math.round(hsl[0] * 360) : 0;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, l];
}