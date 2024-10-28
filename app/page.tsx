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

const processSvgContent = (content: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');

  ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].forEach(tag => {
    doc.querySelectorAll(tag).forEach((element) => updateColor(element, "#8E8E8E"));
  });

  return new XMLSerializer().serializeToString(doc);
};

const updateColor = (element: Element, color: string) => {
  if (element.hasAttribute('fill')) {
    element.setAttribute('fill', color);
  }
  if (element.hasAttribute('stroke')) {
    element.setAttribute('stroke', color);
  }
  if (element.hasAttribute('style')) {
    let style = element.getAttribute('style') || '';
    style = style.replace(/fill:\s*[^;]+/g, `fill: ${color}`);
    style = style.replace(/stroke:\s*[^;]+/g, `stroke: ${color}`);
    element.setAttribute('style', style);
  }
};

export default function Home() {
  const [innerShadow, setInnerShadow] = useState(false);
  const [outerShadow, setOuterShadow] = useState(false);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(0);
  const [selectedShape, setSelectedShape] = useState("Circle");
  const [color, setColor] = useState("#8e8e8e");
  const [size, setSize] = useState(200);
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [svgContent, setSvgContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [innerShadowColor, setInnerShadowColor] = useState("#000000");
  const [outerShadowColor, setOuterShadowColor] = useState("#000000");
  const [textureImage, setTextureImage] = useState<string | null>(null);

  const quadrantRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (svgContent) {
  //     updateSvgColor(color);
  //   }
  // }, [svgContent, color, size, rotation, tilt, strokeWidth]);

  useEffect(() => {
    if (svgContent) {
      updateSvgColor(color);
    }
  }, [svgContent, color, size, rotation, tilt, strokeWidth, textureImage]);

  const handleFileUpload = (file: File) => {
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const processedContent = processSvgContent(content);
        setSvgContent(processedContent);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload an SVG file.");
    }
  };

  const handleTextureUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextureImage(content);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload an image file.");
    }
  };

  const getSvgStyle = () => {
    return {
      width: `${size}px`,
      height: `${size}px`,
      transform: `rotate(${rotation}deg) perspective(500px) rotateX(${tilt}deg)`,
      filter: getOuterShadowStyle(),
    };
  };

  const getOuterShadowStyle = () => {
    if (!outerShadow) return '';
    
    const shadowColor = outerShadowColor + "E6";
    const blurRadius = Math.sqrt(shadowX * shadowX + shadowY * shadowY);
    return `drop-shadow(${shadowX}px ${shadowY}px ${blurRadius}px ${shadowColor})`;
  };

  const getInnerShadowFilter = () => {
    if (!innerShadow) return '';
    
    const shadowColor = innerShadowColor;

    return `
    <filter id="innerShadow" x0="-50%" y0="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.25" result="blur1"></feGaussianBlur>
      <feOffset dy="1"></feOffset>
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff1"></feComposite>
      
      <feFlood flood-color="${shadowColor}" flood-opacity="0.4"></feFlood>
      <feComposite in2="shadowDiff1" operator="in"></feComposite>
      <feComposite in2="SourceGraphic" operator="over" result="firstLayer"></feComposite>
      
      <feGaussianBlur in="firstLayer" stdDeviation="0.5" result="blur2"></feGaussianBlur>
      <feOffset dy="2"></feOffset>
      <feComposite in2="firstLayer" operator="arithmetic" k2="-1" k3="1" result="shadowDiff2"></feComposite>
      
      <feFlood flood-color="${shadowColor}" flood-opacity="0.65"></feFlood>
      <feComposite in2="shadowDiff2" operator="in"></feComposite>
      <feComposite in2="firstLayer" operator="over" result="secondLayer"></feComposite>
      
      <feGaussianBlur in="secondLayer" stdDeviation="0.3" result="blur3"></feGaussianBlur>
      <feOffset dy="3"></feOffset>
      <feComposite in2="secondLayer" operator="arithmetic" k2="-1" k3="1" result="shadowDiff3"></feComposite>
      
      <feFlood flood-color="${shadowColor}" flood-opacity="0.65"></feFlood>
      <feComposite in2="shadowDiff3" operator="in"></feComposite>
      <feComposite in2="secondLayer" operator="over"></feComposite>
    </filter>`
  };

  const containerStyle = {
    width: '400px',
    height: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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

  // const updateSvgColor = (newColor: string) => {
  //   if (svgRef.current) {
  //     const svgElement = svgRef.current.querySelector('svg');
  //     if (svgElement) {
  //       ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].forEach(tag => {
  //         svgElement.querySelectorAll(tag).forEach((element) => updateColor(element, newColor));
  //       });
  //     }
  //   }
  // };

  const updateSvgColor = (newColor: string) => {
    if (svgRef.current) {
      const svgElement = svgRef.current.querySelector('svg');
      if (svgElement) {
        if (textureImage) {
          // Apply texture
          const patternId = 'texturePattern';
          const defs = svgElement.querySelector('defs') || svgElement.insertBefore(document.createElementNS("http://www.w3.org/2000/svg", "defs"), svgElement.firstChild);
          defs.innerHTML += `
            <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="100%" height="100%">
              <image href="${textureImage}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
            </pattern>
          `;
          ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].forEach(tag => {
            svgElement.querySelectorAll(tag).forEach((element) => {
              element.setAttribute('fill', `url(#${patternId})`);
              element.setAttribute('stroke', 'none');
            });
          });
        } else {
          // Apply solid color
          ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].forEach(tag => {
            svgElement.querySelectorAll(tag).forEach((element) => updateColor(element, newColor));
          });
        }
      }
    }
  };

  const extractSvgAttributes = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (svgElement) {
      const attributes = svgElement.attributes;
      const attrObj: { [key: string]: string } = {};
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        attrObj[attr.name] = attr.value;
      }
      return attrObj;
    }
    return {};
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4 flex items-center justify-center bg-gray-100">
        <Card className="w-fit">
          <CardContent className="p-4">
            {svgContent ? (
              <div style={containerStyle}>
                <div ref={svgRef as React.RefObject<HTMLDivElement>} style={{ position: 'relative' }}>
                  <svg
                    {...extractSvgAttributes(svgContent)}
                    width={size}
                    height={size}
                    style={getSvgStyle()}
                  >
                    <defs dangerouslySetInnerHTML={{ __html: getInnerShadowFilter()}} />
                    <g filter={innerShadow ? 'url(#innerShadow)' : ''} dangerouslySetInnerHTML={{ __html: svgContent.replace(/<svg[^>]*>|<\/svg>/g, '') }} />
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
      </div>

      <div className="w-80 bg-white p-4 flex flex-col">
        <div className="flex-grow overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Shadows and Direction</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Inner Shadow</Label>
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
                  <Label className="mb-2 block">Shadow Direction</Label>
                  <div 
                    ref={quadrantRef}
                    className="w-full h-32 bg-gray-200 relative cursor-pointer overflow-hidden"
                    onClick={handleQuadrantClick}
                  >
                    <div className="absolute top-0 left-0 w-full h-full">
                      <div className="absolute top-1/2 left-1/2 w-px h-full bg-gray-400 transform -translate-x-1/2"></div>
                      <div className="absolute top-1/2 left-1/2 w-full h-px bg-gray-400 transform -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Size, Rotation, and Tilt</h3>
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Color</h3>
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Shape</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Mask Shape</Label>
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
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Texture</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Upload Texture Image</Label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => e.target.files && handleTextureUpload(e.target.files[0])}
                  />
                </div>
                {textureImage && (
                  <div>
                    <Button onClick={() => {
                      setTextureImage(null);
                      updateSvgColor(color);
                    }}>
                      Remove Texture
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        
        {svgContent && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={handleDownload} className="w-full">
              Download as PNG
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}