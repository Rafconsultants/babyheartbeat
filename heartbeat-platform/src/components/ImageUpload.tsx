'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { validateImageFile, formatFileSize } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onError?: (error: string) => void
  className?: string
}

export default function ImageUpload({ onImageSelect, onError, className = '' }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      onError?.(validation.error || 'Invalid file')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Call the parent handler
    onImageSelect(file)
  }, [onImageSelect, onError])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleFileSelect(imageFile)
    } else {
      onError?.('Please select a valid image file')
    }
  }, [handleFileSelect, onError])

  const handleButtonClick = () => {
    document.getElementById('file-input')?.click()
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-pink-400 bg-pink-50'
              : 'border-gray-300 hover:border-pink-300 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-pink-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload your ultrasound image
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your image here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG and PNG formats • Max 10MB
              </p>
            </div>

            <button
              onClick={handleButtonClick}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Choose File
            </button>
          </div>

          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <div className="w-full h-64 relative rounded-lg border border-gray-200 overflow-hidden">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={removeFile}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Remove
                </button>
                <button
                  onClick={handleButtonClick}
                  className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
